import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthContextType, AuthUser } from "../types";
import {
  tokenStorage,
  decodeToken,
  isTokenExpired,
} from "../utils/tokenStorage";
// Database imports removed for POC - using fake auth

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check if user is already logged in on app start (POC - no database)
   */
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const storedToken = await tokenStorage.getToken();
        const storedUser = await tokenStorage.getUser();

        if (storedToken && !isTokenExpired(storedToken)) {
          setToken(storedToken);
          setUser(storedUser);
        } else {
          // Token expired or invalid
          await tokenStorage.clearAll();
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error("Error initializing app:", error);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void initializeApp();
  }, []);

  /**
   * Login function - Simplified for POC
   * Just validates email/password and stores a fake token
   * All users are "Site Auditor" role
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);

      // Validate inputs
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      // Trim inputs to handle whitespace
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      console.log("Login attempt - Email:", trimmedEmail);

      // For POC: Simple validation - just check if both fields have values
      // In production, this will call RADAR API
      if (trimmedPassword.length < 3) {
        throw new Error("Invalid email or password");
      }

      // Extract username from email (part before @)
      const username = trimmedEmail.split("@")[0] || trimmedEmail;

      // Create fake JWT token (valid for 24 hours) - for POC only
      const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
      const mockToken = createMockJWT({
        id: 1,
        email: trimmedEmail,
        username: username,
        role: "site_auditor",
        iat: Math.floor(Date.now() / 1000),
        exp: expiresAt,
      });

      // Create user object for app - everyone is "Site Auditor"
      const authUser: AuthUser = {
        id: "1",
        email: trimmedEmail,
        username: username,
        name: username,
        role: "site_auditor",
      };

      // Save to secure storage
      try {
        await tokenStorage.saveToken(mockToken);
        await tokenStorage.saveUser(authUser);
      } catch (err) {
        console.error("Error saving credentials:", err);
      }

      setToken(mockToken);
      setUser(authUser);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Signup function - creates new user in SQLite database with hashed password
   * Determines admin role based on email pattern and password
   */
  // Signup removed for POC - users managed externally via RADAR API

  /**
   * Logout function
   */
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await tokenStorage.clearAll();
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check auth status
   */
  const checkAuthStatus = async (): Promise<void> => {
    try {
      const storedToken = await tokenStorage.getToken();

      if (storedToken && !isTokenExpired(storedToken)) {
        const storedUser = await tokenStorage.getUser();
        setToken(storedToken);
        setUser(storedUser);
      } else {
        await tokenStorage.clearAll();
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setToken(null);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isSignedIn: !!token && !!user,
    isAdmin: false, // No admin role for POC
    isSuperAdmin: false, // No super admin role for POC
    isUser: true, // Everyone is a site auditor
    login,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use Auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/**
 * Create a mock JWT token with header.payload.signature structure
 * This is for frontend-only demo purposes
 */
function createMockJWT(payload: any): string {
  // JWT Header
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  // Encode header and payload to base64 using btoa
  const encodeBase64 = (obj: any): string => {
    const json = JSON.stringify(obj);
    try {
      return btoa(unescape(encodeURIComponent(json)));
    } catch (e) {
      return json;
    }
  };

  const encodedHeader = encodeBase64(header);
  const encodedPayload = encodeBase64(payload);

  // Mock signature (in production, this would be signed on backend)
  const signature = encodeBase64({
    sig: "mock_signature_" + Date.now(),
  });

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
