/**
 * Centralized event bus for sync operations (Expo-compatible)
 * Allows decoupled components to react to sync state changes
 */

export type SyncEventType =
  | "asset:queued"
  | "asset:uploading"
  | "asset:uploaded"
  | "asset:failed"
  | "asset:retrying"
  | "queue:started"
  | "queue:completed"
  | "network:online"
  | "network:offline";

export interface SyncEventPayload {
  assetId?: number;
  timestamp: number;
  duration?: number;
  error?: string;
  serverId?: string;
  attempt?: number;
  nextRetryIn?: number;
  [key: string]: any;
}

export interface SyncEventListener {
  (payload: SyncEventPayload): void;
}

class SyncEventBus {
  private listeners: Map<SyncEventType, Set<SyncEventListener>> = new Map();

  onSyncEvent(eventType: SyncEventType, listener: SyncEventListener): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
  }

  offSyncEvent(eventType: SyncEventType, listener: SyncEventListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  private emit(eventType: SyncEventType, payload: SyncEventPayload): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(payload);
        } catch (error) {
          console.error(`Error in listener for ${eventType}:`, error);
        }
      });
    }
  }

  emitAssetQueued(assetId: number): void {
    this.emit("asset:queued", {
      assetId,
      timestamp: Date.now(),
    });
  }

  emitAssetUploading(assetId: number, attempt: number = 1): void {
    this.emit("asset:uploading", {
      assetId,
      timestamp: Date.now(),
      attempt,
    });
  }

  emitAssetUploaded(assetId: number, serverId: string, duration: number): void {
    this.emit("asset:uploaded", {
      assetId,
      timestamp: Date.now(),
      serverId,
      duration,
    });
  }

  emitAssetFailed(
    assetId: number,
    error: string,
    finalError: boolean = false
  ): void {
    this.emit("asset:failed", {
      assetId,
      timestamp: Date.now(),
      error,
      finalError,
    });
  }

  emitAssetRetrying(
    assetId: number,
    attempt: number,
    nextRetryIn: number,
    error: string
  ): void {
    this.emit("asset:retrying", {
      assetId,
      timestamp: Date.now(),
      attempt,
      nextRetryIn,
      error,
    });
  }

  emitQueueStarted(totalItems: number): void {
    this.emit("queue:started", {
      timestamp: Date.now(),
      totalItems,
    });
  }

  emitQueueCompleted(totalProcessed: number, failedCount: number): void {
    this.emit("queue:completed", {
      timestamp: Date.now(),
      totalProcessed,
      failedCount,
    });
  }

  emitNetworkOnline(): void {
    this.emit("network:online", {
      timestamp: Date.now(),
    });
  }

  emitNetworkOffline(): void {
    this.emit("network:offline", {
      timestamp: Date.now(),
    });
  }
}

export const syncEventBus = new SyncEventBus();
export default syncEventBus;
