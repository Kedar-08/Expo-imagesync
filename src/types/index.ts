export type AssetStatus = "pending" | "uploading" | "uploaded" | "failed";

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
