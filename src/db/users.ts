import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";
import { recordAdminPromotion } from "./db";

/**
 * Simple password hashing using SHA256 with salt
 * Note: For production, use a proper bcrypt library on the backend
 */
const hashPassword = async (
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
 * Verify password against hash
 */
const verifyPasswordHash = async (
  password: string,
  hash: string
): Promise<boolean> => {
  const [salt] = hash.split(":");
  const newHash = await hashPassword(password, salt);
  return newHash === hash;
};

const db = SQLite.openDatabase("photosync.db");

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
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY NOT NULL,
          email TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          passwordHash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );`,
        [],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
}

/**
 * Register a new user with email, username, and password
 */
export async function registerUser(
  email: string,
  username: string,
  password: string
): Promise<StoredUser> {
  // Validate inputs
  if (!email || !username || !password) {
    throw new Error("Email, username, and password are required");
  }

  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash the password
  const passwordHash = await hashPassword(password);

  const now = new Date().toISOString();

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `INSERT INTO users (email, username, passwordHash, role, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [email, username, passwordHash, "user", now, now],
        (_, result) => {
          // Retrieve the newly created user
          const insertId = (result.insertId as number) || 0;
          tx.executeSql(
            `SELECT * FROM users WHERE id = ?;`,
            [insertId],
            (_, { rows }) => {
              if (rows.length > 0) {
                resolve(rows._array[0] as StoredUser);
              } else {
                reject(new Error("Failed to retrieve created user"));
              }
            },
            (_, error) => {
              reject(error);
              return false;
            }
          );
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
}

/**
 * Get user by email address
 */
export async function getUserByEmail(
  email: string
): Promise<StoredUser | null> {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM users WHERE email = ?;`,
        [email],
        (_, { rows }) => {
          if (rows.length > 0) {
            resolve(rows._array[0] as StoredUser);
          } else {
            resolve(null);
          }
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
}

/**
 * Get user by username
 */
export async function getUserByUsername(
  username: string
): Promise<StoredUser | null> {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM users WHERE username = ?;`,
        [username],
        (_, { rows }) => {
          if (rows.length > 0) {
            resolve(rows._array[0] as StoredUser);
          } else {
            resolve(null);
          }
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
}

/**
 * Verify password against stored hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await verifyPasswordHash(password, hash);
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
}

/**
 * Update user role (admin operation)
 * @param userId The user ID to update
 * @param role The new role
 * @param promotedByAdminId Optional: ID of the admin making the promotion (for tracking)
 * @param promotedByAdminUsername Optional: Username of the admin making the promotion
 */
export async function updateUserRole(
  userId: number,
  role: "superadmin" | "admin" | "user",
  promotedByAdminId?: number,
  promotedByAdminUsername?: string
): Promise<StoredUser> {
  const now = new Date().toISOString();

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `UPDATE users SET role = ?, updatedAt = ? WHERE id = ?;`,
        [role, now, userId],
        async () => {
          // Retrieve the updated user
          tx.executeSql(
            `SELECT * FROM users WHERE id = ?;`,
            [userId],
            async (_, { rows }) => {
              if (rows.length > 0) {
                const updatedUser = rows._array[0] as StoredUser;

                // Track promotion if admin info is provided and role is being set to admin
                if (
                  role === "admin" &&
                  promotedByAdminId &&
                  promotedByAdminUsername
                ) {
                  try {
                    await recordAdminPromotion(
                      userId,
                      updatedUser.username,
                      promotedByAdminId,
                      promotedByAdminUsername
                    );
                  } catch (error) {
                    console.error("Error recording admin promotion:", error);
                    // Don't fail the update if tracking fails
                  }
                }

                resolve(updatedUser);
              } else {
                reject(new Error("User not found"));
              }
            },
            (_, error) => {
              reject(error);
              return false;
            }
          );
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
}

/**
 * Get all users (admin operation)
 */
export async function getAllUsers(): Promise<StoredUser[]> {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM users ORDER BY createdAt DESC;`,
        [],
        (_, { rows }) => {
          resolve(rows._array as StoredUser[]);
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
}

/**
 * Delete user by ID (admin operation)
 */
export async function deleteUser(userId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `DELETE FROM users WHERE id = ?;`,
        [userId],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
}

/**
 * Clear all users (for testing only)
 */
export async function clearAllUsers(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `DELETE FROM users;`,
        [],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
}

/**
 * Create or get Super Admin user
 */
export async function createOrGetSuperAdmin(
  email: string,
  username: string
): Promise<StoredUser> {
  // First try to get existing user by email
  const existingUserByEmail = await getUserByEmail(email);
  if (existingUserByEmail) {
    // User with this email exists, ensure they have superadmin role
    if (existingUserByEmail.role !== "superadmin") {
      return await updateUserRole(existingUserByEmail.id, "superadmin");
    }
    return existingUserByEmail;
  }

  // Check if a user with this username already exists
  const existingUserByUsername = await getUserByUsername(username);
  if (existingUserByUsername) {
    // Username already exists - this is a conflict
    // We cannot change it because emails and usernames must be unique
    // Return the existing user with superadmin role
    if (existingUserByUsername.role !== "superadmin") {
      return await updateUserRole(existingUserByUsername.id, "superadmin");
    }
    return existingUserByUsername;
  }

  // Neither email nor username exist, create new Super Admin user
  const passwordHash = await hashPassword("Superadmin123");
  const now = new Date().toISOString();

  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `INSERT INTO users (email, username, passwordHash, role, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [email, username, passwordHash, "superadmin", now, now],
        (_, result) => {
          // Retrieve the newly created user
          const insertId = (result.insertId as number) || 0;
          tx.executeSql(
            `SELECT * FROM users WHERE id = ?;`,
            [insertId],
            (_, { rows }) => {
              if (rows.length > 0) {
                resolve(rows._array[0] as StoredUser);
              } else {
                reject(new Error("Failed to retrieve created Super Admin"));
              }
            },
            (_, error) => {
              reject(error);
              return false;
            }
          );
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
}
