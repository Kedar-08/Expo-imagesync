import { recordAdminPromotion } from "./db";
import {
  execSql,
  queryOne,
  hashPassword,
  verifyPassword,
} from "../utils/dbHelpers";

export interface StoredUser {
  id: number;
  email: string;
  username: string;
  passwordHash: string;
  role: "superadmin" | "admin" | "user";
  createdAt: string;
  updatedAt: string;
}

/**
 * Initialize the users table if it doesn't exist
 */
export async function initializeUsersTable(): Promise<void> {
  await execSql(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY NOT NULL,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`
  );
}

/**
 * Get user by email address
 */
export async function getUserByEmail(
  email: string
): Promise<StoredUser | null> {
  return queryOne<StoredUser>(`SELECT * FROM users WHERE email = ?`, [email]);
}

/**
 * Get user by username
 */
export async function getUserByUsername(
  username: string
): Promise<StoredUser | null> {
  return queryOne<StoredUser>(`SELECT * FROM users WHERE username = ?`, [
    username,
  ]);
}

/**
 * Get user by ID
 */
export async function getUserById(id: number): Promise<StoredUser | null> {
  return queryOne<StoredUser>(`SELECT * FROM users WHERE id = ?`, [id]);
}

/**
 * Verify password against stored hash (wrapper around helper)
 */
export async function verifyPasswordHash(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await verifyPassword(password, hash);
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
}

/**
 * Update user role (admin operation - POC: simplified)
 */
export async function updateUserRole(
  userId: number,
  role: "superadmin" | "admin" | "user",
  promotedByAdminId?: number,
  promotedByAdminUsername?: string
): Promise<StoredUser> {
  const now = new Date().toISOString();

  await execSql(`UPDATE users SET role = ?, updatedAt = ? WHERE id = ?`, [
    role,
    now,
    userId,
  ]);

  const updatedUser = (await getUserById(userId)) as StoredUser;

  if (role === "admin" && promotedByAdminId && promotedByAdminUsername) {
    try {
      await recordAdminPromotion(
        userId,
        updatedUser.username,
        promotedByAdminId,
        promotedByAdminUsername
      );
    } catch (error) {
      console.error("Error recording admin promotion:", error);
    }
  }

  return updatedUser;
}

/**
 * Create or get Super Admin user (POC: for initial setup)
 */
export async function createOrGetSuperAdmin(
  email: string,
  username: string
): Promise<StoredUser> {
  let existing = await getUserByEmail(email);
  if (existing) {
    if (existing.role !== "superadmin") {
      return await updateUserRole(existing.id, "superadmin");
    }
    return existing;
  }

  existing = await getUserByUsername(username);
  if (existing) {
    if (existing.role !== "superadmin") {
      return await updateUserRole(existing.id, "superadmin");
    }
    return existing;
  }

  const passwordHash = await hashPassword("Superadmin123");
  const now = new Date().toISOString();

  await execSql(
    `INSERT INTO users (email, username, passwordHash, role, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [email, username, passwordHash, "superadmin", now, now]
  );

  return (await getUserByEmail(email)) as StoredUser;
}
