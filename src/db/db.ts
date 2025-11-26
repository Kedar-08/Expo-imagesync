import type { LocalAssetRecord } from "../types";
import { execSql, queryAll, queryOne, insertOne } from "../utils/dbHelpers";

export async function initializeSchema(): Promise<void> {
  await execSql(
    `CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      timestamp_ms INTEGER NOT NULL,
      status TEXT NOT NULL,
      retries INTEGER NOT NULL DEFAULT 0,
      latitude REAL,
      longitude REAL,
      image_base64 TEXT NOT NULL,
      uri TEXT,
      server_id TEXT,
      file_size_bytes INTEGER,
      user_id INTEGER,
      username TEXT
    )`
  );

  // Migration: Add user_id and username columns if they don't exist
  try {
    await execSql(`ALTER TABLE assets ADD COLUMN user_id INTEGER`);
  } catch (err) {
    // Column already exists, ignore error
  }

  try {
    await execSql(`ALTER TABLE assets ADD COLUMN username TEXT`);
  } catch (err) {
    // Column already exists, ignore error
  }

  // Migration: Clear invalid server IDs from previous mock versions
  // (e.g., "local_1_", "server_1_timestamp", etc.)
  try {
    await execSql(
      `UPDATE assets SET server_id = NULL WHERE server_id LIKE 'local_%' OR server_id LIKE 'server_%'`
    );
  } catch (err) {
    // Ignore if column doesn't exist yet
  }

  // Create admin_promotions table for tracking who promoted which users
  await execSql(
    `CREATE TABLE IF NOT EXISTS admin_promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      promoted_user_id INTEGER NOT NULL,
      promoted_user_username TEXT NOT NULL,
      promoted_user_email TEXT,
      promoted_by_admin_id INTEGER NOT NULL,
      promoted_by_admin_username TEXT NOT NULL,
      promotion_timestamp_ms INTEGER NOT NULL
    )`
  );

  // Migration: Add email column to admin_promotions if it doesn't exist
  try {
    await execSql(
      `ALTER TABLE admin_promotions ADD COLUMN promoted_user_email TEXT`
    );
  } catch (err) {
    // Column already exists, ignore error
  }

  // Create deleted_assets table for tracking deleted images
  await execSql(
    `CREATE TABLE IF NOT EXISTS deleted_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_filename TEXT NOT NULL,
      asset_original_id INTEGER,
      original_uploader_id INTEGER,
      original_uploader_username TEXT,
      image_base64 TEXT,
      mime_type TEXT,
      deleted_by_admin_id INTEGER NOT NULL,
      deleted_by_admin_username TEXT NOT NULL,
      deletion_timestamp_ms INTEGER NOT NULL
    )`
  );

  // Migration: Add image columns to deleted_assets if they don't exist
  try {
    await execSql(`ALTER TABLE deleted_assets ADD COLUMN image_base64 TEXT`);
  } catch (err) {
    // Column already exists, ignore error
  }

  try {
    await execSql(`ALTER TABLE deleted_assets ADD COLUMN mime_type TEXT`);
  } catch (err) {
    // Column already exists, ignore error
  }
}

export async function insertAsset(params: {
  filename: string;
  mimeType: string;
  timestampMs: number;
  status: "pending" | "uploaded" | "failed";
  retries?: number;
  latitude?: number | null;
  longitude?: number | null;
  imageBase64: string;
  uri?: string | null;
  fileSizeBytes?: number;
  userId?: number | null;
  username?: string | null;
}): Promise<number> {
  return insertOne(
    `INSERT INTO assets (filename, mime_type, timestamp_ms, status, retries, latitude, longitude, image_base64, uri, file_size_bytes, user_id, username)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params.filename,
      params.mimeType,
      params.timestampMs,
      params.status,
      params.retries ?? 0,
      params.latitude ?? null,
      params.longitude ?? null,
      params.imageBase64,
      params.uri ?? null,
      params.fileSizeBytes ?? null,
      params.userId ?? null,
      params.username ?? null,
    ]
  );
}

export async function getAllAssets(): Promise<LocalAssetRecord[]> {
  const rows = await queryAll<any>(`SELECT * FROM assets ORDER BY id DESC`);
  return rows.map(mapRow);
}

export async function getPendingAssets(limit = 5): Promise<LocalAssetRecord[]> {
  const rows = await queryAll<any>(
    `SELECT * FROM assets WHERE status IN ('pending', 'failed') ORDER BY id ASC LIMIT ?`,
    [limit]
  );
  return rows.map(mapRow);
}

export async function reservePendingAssets(
  limit = 5
): Promise<LocalAssetRecord[]> {
  // Fetch ids to reserve (include failed items to retry when online)
  const sel = await queryAll<{ id: number }>(
    `SELECT id FROM assets WHERE status IN ('pending', 'failed') ORDER BY id ASC LIMIT ?`,
    [limit]
  );
  if (sel.length === 0) return [];

  const ids = sel.map((r) => r.id);
  const placeholders = ids.map(() => "?").join(",");

  // Mark them as uploading
  await execSql(
    `UPDATE assets SET status = 'uploading' WHERE id IN (${placeholders})`,
    ids
  );

  // Return the full rows
  const rowsRes = await queryAll<any>(
    `SELECT * FROM assets WHERE id IN (${placeholders}) ORDER BY id ASC`,
    ids
  );
  return rowsRes.map(mapRow);
}

export async function markUploaded(
  id: number,
  serverId: string
): Promise<void> {
  await execSql(
    `UPDATE assets SET status = 'uploaded', server_id = ? WHERE id = ?`,
    [serverId, id]
  );
}

export async function incrementRetry(id: number): Promise<number> {
  await execSql(`UPDATE assets SET retries = retries + 1 WHERE id = ?`, [id]);
  const row = await queryOne<{ retries: number }>(
    `SELECT retries FROM assets WHERE id = ?`,
    [id]
  );
  return row?.retries ?? 0;
}

export async function markFailed(id: number): Promise<void> {
  await execSql(`UPDATE assets SET status = 'failed' WHERE id = ?`, [id]);
}

export async function setPending(id: number): Promise<void> {
  await execSql(`UPDATE assets SET status = 'pending' WHERE id = ?`, [id]);
}

export async function resetFailedAssets(): Promise<void> {
  // Reset all failed items back to pending with retry count reset
  await execSql(
    `UPDATE assets SET status = 'pending', retries = 0 WHERE status = 'failed'`
  );
}

export async function resetAsset(id: number): Promise<void> {
  // Reset specific asset back to pending with retry count reset
  await execSql(
    `UPDATE assets SET status = 'pending', retries = 0 WHERE id = ?`,
    [id]
  );
}

export async function incrementRetryCapped(
  id: number,
  maxRetries: number
): Promise<number> {
  const row = await queryOne<{ retries: number }>(
    `SELECT retries FROM assets WHERE id = ?`,
    [id]
  );
  const current = row?.retries ?? 0;
  if (current >= maxRetries) return current;
  await execSql(`UPDATE assets SET retries = ? WHERE id = ?`, [
    current + 1,
    id,
  ]);
  return current + 1;
}

function mapRow(r: any): LocalAssetRecord {
  return {
    id: r.id,
    filename: r.filename,
    mimeType: r.mime_type,
    timestampMs: r.timestamp_ms,
    status: r.status,
    retries: r.retries,
    latitude: r.latitude ?? null,
    longitude: r.longitude ?? null,
    imageBase64: r.image_base64,
    uri: r.uri ?? null,
    serverId: r.server_id ?? null,
    fileSizeBytes: r.file_size_bytes ?? null,
    userId: r.user_id ?? null,
    username: r.username ?? null,
  };
}

export async function deleteAsset(
  id: number,
  deletedByAdminId?: number,
  deletedByAdminUsername?: string
): Promise<void> {
  // If admin info is provided, record the deletion
  if (deletedByAdminId && deletedByAdminUsername) {
    // First get the asset details before deleting
    const asset = await queryOne<any>(
      `SELECT filename, user_id, username, image_base64, mime_type FROM assets WHERE id = ?`,
      [id]
    );

    if (asset) {
      // Record the deletion
      await execSql(
        `INSERT INTO deleted_assets (asset_filename, asset_original_id, original_uploader_id, original_uploader_username, image_base64, mime_type, deleted_by_admin_id, deleted_by_admin_username, deletion_timestamp_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          asset.filename,
          id,
          asset.user_id ?? null,
          asset.username ?? null,
          asset.image_base64 || null,
          asset.mime_type || null,
          deletedByAdminId,
          deletedByAdminUsername,
          Date.now(),
        ]
      );
    }
  }

  await execSql(`DELETE FROM assets WHERE id = ?`, [id]);
}

export interface AssetWithUser extends LocalAssetRecord {
  userId?: number | null;
  username?: string | null;
}

export async function getAllAssetsWithUsers(): Promise<AssetWithUser[]> {
  const rows = await queryAll<any>(
    `SELECT * FROM assets ORDER BY timestamp_ms DESC`
  );
  return rows.map((row) => ({
    ...mapRow(row),
    userId: row.user_id ?? null,
    username: row.username ?? null,
  }));
}

export async function getAssetsByUserId(
  userId: number
): Promise<AssetWithUser[]> {
  const rows = await queryAll<any>(
    `SELECT * FROM assets WHERE user_id = ? ORDER BY timestamp_ms DESC`,
    [userId]
  );
  return rows.map((row) => ({
    ...mapRow(row),
    userId: row.user_id ?? null,
    username: row.username ?? null,
  }));
}

// Types for admin tracking
export interface AdminPromotion {
  id: number;
  promotedUserId: number;
  promotedUsername: string;
  promotedUserEmail?: string | null;
  promotedByAdminId: number;
  promotedByAdminUsername: string;
  promotionTimestampMs: number;
}

export interface DeletedAssetRecord {
  id: number;
  assetFilename: string;
  assetOriginalId: number | null;
  originalUploaderId: number | null;
  originalUploaderUsername: string | null;
  imageBase64?: string | null;
  mimeType?: string | null;
  deletedByAdminId: number;
  deletedByAdminUsername: string;
  deletionTimestampMs: number;
}

export async function getAdminPromotions(
  adminId: number
): Promise<AdminPromotion[]> {
  const rows = await queryAll<any>(
    `SELECT ap.*, u.email FROM admin_promotions ap 
     LEFT JOIN users u ON ap.promoted_user_id = u.id 
     WHERE ap.promoted_by_admin_id = ? ORDER BY ap.promotion_timestamp_ms DESC`,
    [adminId]
  );
  return rows.map((row) => ({
    id: row.id,
    promotedUserId: row.promoted_user_id,
    promotedUsername: row.promoted_user_username,
    promotedUserEmail: row.promoted_user_email ?? row.email ?? null,
    promotedByAdminId: row.promoted_by_admin_id,
    promotedByAdminUsername: row.promoted_by_admin_username,
    promotionTimestampMs: row.promotion_timestamp_ms,
  }));
}

export async function getDeletedAssetsByAdmin(
  adminId: number
): Promise<DeletedAssetRecord[]> {
  const rows = await queryAll<any>(
    `SELECT * FROM deleted_assets WHERE deleted_by_admin_id = ? ORDER BY deletion_timestamp_ms DESC`,
    [adminId]
  );
  return rows.map((row) => ({
    id: row.id,
    assetFilename: row.asset_filename,
    assetOriginalId: row.asset_original_id ?? null,
    originalUploaderId: row.original_uploader_id ?? null,
    originalUploaderUsername: row.original_uploader_username ?? null,
    imageBase64: row.image_base64 ?? null,
    mimeType: row.mime_type ?? null,
    deletedByAdminId: row.deleted_by_admin_id,
    deletedByAdminUsername: row.deleted_by_admin_username,
    deletionTimestampMs: row.deletion_timestamp_ms,
  }));
}

export async function recordAdminPromotion(
  promotedUserId: number,
  promotedUsername: string,
  promotedByAdminId: number,
  promotedByAdminUsername: string
): Promise<void> {
  // Fetch the user's email from the users table
  const user = await queryOne<{ email: string }>(
    `SELECT email FROM users WHERE id = ?`,
    [promotedUserId]
  );

  await execSql(
    `INSERT INTO admin_promotions (promoted_user_id, promoted_user_username, promoted_user_email, promoted_by_admin_id, promoted_by_admin_username, promotion_timestamp_ms)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      promotedUserId,
      promotedUsername,
      user?.email ?? null,
      promotedByAdminId,
      promotedByAdminUsername,
      Date.now(),
    ]
  );
}
