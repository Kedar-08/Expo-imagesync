/**
 * Database helper utilities to reduce code duplication.
 * Consolidates common transaction/promise patterns and crypto utilities.
 */
import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";

const db = (SQLite as any).openDatabase("photosync.db");

/**
 * Execute a SQL query and return the result wrapped in a promise.
 */
export function execSql<T = any>(sql: string, params: any[] = []): Promise<T> {
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

/**
 * Execute a SELECT query and return the first row or null.
 */
export async function queryOne<T>(
  sql: string,
  params: any[] = []
): Promise<T | null> {
  const result = await execSql<any>(sql, params);
  return result.rows.length > 0 ? (result.rows.item(0) as T) : null;
}

/**
 * Execute a SELECT query and return all rows.
 */
export async function queryAll<T>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const result = await execSql<any>(sql, params);
  return result.rows._array as T[];
}

/**
 * Execute an INSERT and return the inserted ID.
 */
export async function insertOne(
  sql: string,
  params: any[] = []
): Promise<number> {
  const result = await execSql<any>(sql, params);
  return (result.insertId as number) || 0;
}

/**
 * Hash a password with SHA256 and salt
 */
export const hashPassword = async (
  password: string,
  salt?: string
): Promise<string> => {
  const saltValue = salt || Crypto.randomUUID();
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    saltValue + password
  );
  return `${saltValue}:${hash}`;
};

/**
 * Verify a password against a hash
 */
export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  const [salt] = hash.split(":");
  const newHash = await hashPassword(password, salt);
  return newHash === hash;
};
