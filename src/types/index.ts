export type AssetStatus = "pending" | "uploading" | "uploaded" | "failed";
export type UserRole = "site_auditor"; // Simplified for POC - single role
export type PhotoCategory = "Circuit" | "Space" | "Power" | "Site";

export interface LocalAssetRecord {
  id: number;
  filename: string;
  mimeType: string;
  timestampMs: number;
  status: AssetStatus;
  retries: number;
  latitude?: number | null;
  longitude?: number | null;
  imageBase64: string;
  uri?: string | null;
  serverId?: string | null;
  fileSizeBytes?: number;
  userId?: number | null;
  username?: string | null;
  photoCategory?: PhotoCategory | null;
}

export interface QueueMetrics {
  totalQueued: number;
  inProgress: number;
  completed: number;
  failed: number;
  averageUploadTime: number;
  errorRate: number;
  lastSyncTime: number;
}

export interface ServerUploadResponse {
  serverId: string;
  status: "ok" | "error";
}

// Authentication Types
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isSignedIn: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isUser: boolean;
  login: (email: string, password: string) => Promise<void>;
  // signup removed for POC - users managed externally
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}
