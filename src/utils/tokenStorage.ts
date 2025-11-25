import * as SecureStore from "expo-secure-store";
import { AuthToken } from "../types";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

/**
 * Base64 encoding/decoding utilities for React Native
 * Uses a simple character map approach that works without Buffer
 */
const base64Utils = {
  encode: (str: string): string => {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
      // Fallback for edge cases
      return str;
    }
  },
  decode: (str: string): string => {
    try {
      return decodeURIComponent(escape(atob(str)));
    } catch (e) {
      // Fallback for edge cases
      return str;
    }
  },
};

export const tokenStorage = {
  /**
   * Save JWT token securely
   */
  async saveToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
      console.error("Error saving token:", error);
      throw error;
    }
  },

  /**
   * Retrieve stored JWT token
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      return token;
    } catch (error) {
      console.error("Error retrieving token:", error);
      return null;
    }
  },

  /**
   * Clear stored token
   */
  async clearToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error("Error clearing token:", error);
    }
  },

  /**
   * Save user data
   */
  async saveUser(user: any): Promise<void> {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error("Error saving user:", error);
      throw error;
    }
  },

  /**
   * Retrieve stored user data
   */
  async getUser(): Promise<any | null> {
    try {
      const user = await SecureStore.getItemAsync(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error("Error retrieving user:", error);
      return null;
    }
  },

  /**
   * Clear stored user data
   */
  async clearUser(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (error) {
      console.error("Error clearing user:", error);
    }
  },

  /**
   * Clear all auth data
   */
  async clearAll(): Promise<void> {
    try {
      await Promise.all([this.clearToken(), this.clearUser()]);
    } catch (error) {
      console.error("Error clearing all auth data:", error);
    }
  },
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    const payload = parts[1];
    const decoded = base64Utils.decode(payload);
    const parsed = JSON.parse(decoded);

    const currentTime = Math.floor(Date.now() / 1000);
    return parsed.exp ? parsed.exp < currentTime : false;
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return true;
  }
};

/**
 * Decode JWT token
 */
export const decodeToken = (token: string): any => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = base64Utils.decode(payload);
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};
