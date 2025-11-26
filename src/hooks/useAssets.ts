import { useState, useCallback, useEffect } from "react";
import {
  getAllAssets,
  initializeSchema,
  resetAsset,
  deleteAsset,
} from "../db/db";
import { syncEventBus, type SyncEventPayload } from "../services/SyncEventBus";
import { getQueueManager } from "../services/QueueManager";
import type { LocalAssetRecord } from "../types";
import type { AuthUser } from "../types";

export function useAssets(
  user: AuthUser | null,
  isAdmin: boolean,
  isSuperAdmin: boolean
) {
  const [items, setItems] = useState<LocalAssetRecord[]>([]);
  const [syncingIds, setSyncingIds] = useState<Set<number>>(new Set());
  const [failedIds, setFailedIds] = useState<Set<number>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  // Load all assets from DB
  const reload = useCallback(async () => {
    const all = await getAllAssets();
    setItems(all);
  }, []);

  // Refresh: reload + process queue
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    const queueManager = getQueueManager();
    await queueManager.processQueue();
    setRefreshing(false);
  }, [reload]);

  // Retry failed asset
  const handleRetry = useCallback(
    async (assetId: number) => {
      await resetAsset(assetId);
      await reload();
      const queueManager = getQueueManager();
      await queueManager.enqueue(assetId);
    },
    [reload]
  );

  // Delete asset (with admin tracking if applicable)
  const handleDeleteAsset = useCallback(
    async (assetId: number, filename: string) => {
      try {
        if ((isAdmin || isSuperAdmin) && user) {
          await deleteAsset(assetId, parseInt(user.id, 10), user.username);
        } else {
          await deleteAsset(assetId);
        }
        await reload();
      } catch (error) {
        console.error("Error deleting asset:", error);
        throw error;
      }
    },
    [reload, isAdmin, isSuperAdmin, user]
  );

  // Initialize DB + listen to sync events
  useEffect(() => {
    void (async () => {
      await initializeSchema();
      await reload();
    })();

    const handleAssetUploading = (payload: SyncEventPayload) => {
      if (payload.assetId) {
        setSyncingIds((prev) => new Set(prev).add(payload.assetId!));
      }
    };

    const handleAssetUploaded = (payload: SyncEventPayload) => {
      if (payload.assetId) {
        setSyncingIds((prev) => {
          const updated = new Set(prev);
          updated.delete(payload.assetId!);
          return updated;
        });
        setFailedIds((prev) => {
          const updated = new Set(prev);
          updated.delete(payload.assetId!);
          return updated;
        });
      }
      void reload();
    };

    const handleAssetFailed = (payload: SyncEventPayload) => {
      if (payload.assetId) {
        setSyncingIds((prev) => {
          const updated = new Set(prev);
          updated.delete(payload.assetId!);
          return updated;
        });
        setFailedIds((prev) => new Set(prev).add(payload.assetId!));
      }
    };

    syncEventBus.onSyncEvent("asset:uploading", handleAssetUploading);
    syncEventBus.onSyncEvent("asset:uploaded", handleAssetUploaded);
    syncEventBus.onSyncEvent("asset:failed", handleAssetFailed);

    return () => {
      syncEventBus.offSyncEvent("asset:uploading", handleAssetUploading);
      syncEventBus.offSyncEvent("asset:uploaded", handleAssetUploaded);
      syncEventBus.offSyncEvent("asset:failed", handleAssetFailed);
    };
  }, [reload, isAdmin, isSuperAdmin, user]);

  return {
    items,
    syncingIds,
    failedIds,
    refreshing,
    onRefresh,
    handleRetry,
    handleDeleteAsset,
  };
}
