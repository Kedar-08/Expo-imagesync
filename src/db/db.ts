import * as SQLite from "expo-sqlite";
import type { LocalAssetRecord } from "../types";

const DB_NAME = "photosync.db";
const db = (SQLite as any).openDatabase(DB_NAME);

function execSql<T = any>(sql: string, params: any[] = []): Promise<T> {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        sql,
        params,
        (_: any, result: any) => resolve(result as unknown as T),
        (_: any, err: any) => {
          reject(err);
          return false;
        }
      );
    });
  });
}

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
      file_size_bytes INTEGER
    )`
  );

  // Migration: Add file_size_bytes column if it doesn't exist
  try {
    await execSql(`ALTER TABLE assets ADD COLUMN file_size_bytes INTEGER`);
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
}): Promise<number> {
  const result: any = await execSql(
    `INSERT INTO assets (filename, mime_type, timestamp_ms, status, retries, latitude, longitude, image_base64, uri, file_size_bytes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    ]
  );
  return result.insertId;
}

export async function getAllAssets(): Promise<LocalAssetRecord[]> {
  const res: any = await execSql(`SELECT * FROM assets ORDER BY id DESC`);
  const rows: LocalAssetRecord[] = [];
  for (let i = 0; i < res.rows.length; i++) {
    rows.push(mapRow(res.rows.item(i)));
  }
  return rows;
}

export async function getPendingAssets(limit = 5): Promise<LocalAssetRecord[]> {
  const res: any = await execSql(
    `SELECT * FROM assets WHERE status IN ('pending', 'failed') ORDER BY id ASC LIMIT ?`,
    [limit]
  );
  const rows: LocalAssetRecord[] = [];
  for (let i = 0; i < res.rows.length; i++) {
    rows.push(mapRow(res.rows.item(i)));
  }
  return rows;
}

export async function reservePendingAssets(
  limit = 5
): Promise<LocalAssetRecord[]> {
  // Fetch ids to reserve (include failed items to retry when online)
  const sel: any = await execSql(
    `SELECT id FROM assets WHERE status IN ('pending', 'failed') ORDER BY id ASC LIMIT ?`,
    [limit]
  );
  const ids: number[] = [];
  for (let i = 0; i < sel.rows.length; i++) {
    ids.push(sel.rows.item(i).id);
  }
  if (ids.length === 0) return [];

  // Mark them as uploading
  const placeholders = ids.map(() => "?").join(",");
  await execSql(
    `UPDATE assets SET status = 'uploading' WHERE id IN (${placeholders})`,
    ids
  );

  // Return the full rows
  const rowsRes: any = await execSql(
    `SELECT * FROM assets WHERE id IN (${placeholders}) ORDER BY id ASC`,
    ids
  );
  const out: LocalAssetRecord[] = [];
  for (let i = 0; i < rowsRes.rows.length; i++) {
    out.push(mapRow(rowsRes.rows.item(i)));
  }
  return out;
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
  const sel: any = await execSql(`SELECT retries FROM assets WHERE id = ?`, [
    id,
  ]);
  return sel.rows.item(0).retries;
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
  const sel: any = await execSql(`SELECT retries FROM assets WHERE id = ?`, [
    id,
  ]);
  const current = sel.rows.item(0)?.retries ?? 0;
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
  };
}
