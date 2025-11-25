import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthContextType, AuthUser } from "../types";
import {
  tokenStorage,
  decodeToken,
  isTokenExpired,
} from "../utils/tokenStorage";
import {
  initializeUsersTable,
  registerUser as dbRegisterUser,
  getUserByEmail,
  verifyPassword,
  updateUserRole,
  createOrGetSuperAdmin,
} from "../db/users";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initialize database and check if user is already logged in on app start
   */
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize SQLite users table
        await initializeUsersTable();

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
   * Login function - validates credentials against SQLite database
   * In production, this would call your backend API
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

      console.log(
        "Login attempt - Email:",
        trimmedEmail,
        "Password:",
        trimmedPassword
      );

      // Check if this is Super Admin (hardcoded credentials) - check FIRST
      const isSuperAdminLogin =
        trimmedEmail === "kedar@superadmin.com" &&
        trimmedPassword === "Superadmin123";

      console.log("isSuperAdminLogin:", isSuperAdminLogin);

      let dbUser;

      if (isSuperAdminLogin) {
        // Super Admin login - use dedicated function to create or get Super Admin
        try {
          console.log("Creating or getting Super Admin user...");
          dbUser = await createOrGetSuperAdmin(trimmedEmail, "Kedar08");
          console.log("Super Admin user created/retrieved:", dbUser);
        } catch (error) {
          console.error("Error in createOrGetSuperAdmin:", error);
          throw new Error("Failed to authenticate Super Admin");
        }
      } else {
        // Regular login - look up user in SQLite database
        dbUser = await getUserByEmail(trimmedEmail);
        if (!dbUser) {
          throw new Error("Invalid email or password");
        }

        // Verify password against stored hash
        const passwordMatch = await verifyPassword(
          trimmedPassword,
          dbUser.passwordHash
        );
        if (!passwordMatch) {
          throw new Error("Invalid email or password");
        }

        // Check if this should be admin (email ends with @admin.com and password is Admin123)
        const isAdminLogin =
          trimmedEmail.endsWith("@admin.com") && trimmedPassword === "Admin123";

        // If admin login and user not admin (and not superadmin), update role
        if (isAdminLogin && dbUser.role === "user") {
          dbUser = await updateUserRole(dbUser.id, "admin");
        }
      }

      // Create JWT token (valid for 24 hours)
      const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
      const mockToken = createMockJWT({
        id: dbUser.id,
        email: dbUser.email,
        username: dbUser.username,
        role: dbUser.role,
        iat: Math.floor(Date.now() / 1000),
        exp: expiresAt,
      });

      // Create user object for app
      const authUser: AuthUser = {
        id: dbUser.id.toString(),
        email: dbUser.email,
        username: dbUser.username,
        name: dbUser.username,
        role: dbUser.role,
      };

      // Save to secure storage
      try {
        await tokenStorage.saveToken(mockToken);
      } catch (err) {
        console.error("Error saving token:", err);
      }

      try {
        await tokenStorage.saveUser(authUser);
      } catch (err) {
        console.error("Error saving user:", err);
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
  const signup = async (
    email: string,
    username: string,
    name: string,
    password: string
  ): Promise<void> => {
    try {
      setIsLoading(true);

      // Validate inputs
      if (!email || !username || !name || !password) {
        throw new Error("All fields are required");
      }

      // Check if this is an admin signup (email ends with @admin.com and password is Admin123)
      const isAdminSignup =
        email.endsWith("@admin.com") && password === "Admin123";

      // Check if user already exists
      let dbUser = await getUserByEmail(email);

      if (dbUser) {
        // User exists - verify password and update role if needed
        const passwordMatch = await verifyPassword(
          password,
          dbUser.passwordHash
        );

        if (!passwordMatch) {
          throw new Error("Invalid password for existing user");
        }

        // If admin signup and user not admin, update role
        if (isAdminSignup && dbUser.role !== "admin") {
          dbUser = await updateUserRole(dbUser.id, "admin");
        }
      } else {
        // New user - register in SQLite with hashed password
        dbUser = await dbRegisterUser(email, username, password);

        // If admin email pattern and password, update role to admin
        if (isAdminSignup) {
          dbUser = await updateUserRole(dbUser.id, "admin");
        }
      }

      // Create JWT token (valid for 24 hours)
      const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
      const mockToken = createMockJWT({
        id: dbUser.id,
        email: dbUser.email,
        username: dbUser.username,
        role: dbUser.role,
        iat: Math.floor(Date.now() / 1000),
        exp: expiresAt,
      });

      // Create user object for app
      const authUser: AuthUser = {
        id: dbUser.id.toString(),
        email: dbUser.email,
        username: dbUser.username,
        name: name,
        role: dbUser.role,
      };

      // Save to secure storage
      try {
        await tokenStorage.saveToken(mockToken);
      } catch (err) {
        console.error("Error saving token:", err);
      }

      try {
        await tokenStorage.saveUser(authUser);
      } catch (err) {
        console.error("Error saving user:", err);
      }

      setToken(mockToken);
      setUser(authUser);
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

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
    isAdmin: user?.role === "admin",
    isSuperAdmin: user?.role === "superadmin",
    isUser: user?.role === "user",
    login,
    signup,
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
