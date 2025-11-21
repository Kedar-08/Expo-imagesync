import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { syncEventBus, type SyncEventPayload } from "../services/SyncEventBus";
import { getQueueManager } from "../services/QueueManager";
import { resetFailedAssets } from "../db/db";
import type { QueueMetrics } from "../types";
import * as Network from "expo-network";

export default function QueueStatusBar() {
  const [metrics, setMetrics] = useState<QueueMetrics | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [failedCount, setFailedCount] = useState(0);
  const wasOffline = useRef(false);

  useEffect(() => {
    const handleAssetUploaded = (payload: SyncEventPayload) => {
      setIsSyncing(false);
    };

    const handleAssetFailed = (payload: SyncEventPayload) => {
      setFailedCount((prev) => prev + 1);
    };

    const handleQueueStarted = (payload: SyncEventPayload) => {
      setIsSyncing(true);
    };

    const handleQueueCompleted = (payload: SyncEventPayload) => {
      setIsSyncing(false);
    };

    const handleAssetUploading = (payload: SyncEventPayload) => {
      setIsSyncing(true);
    };

    syncEventBus.onSyncEvent("asset:uploaded", handleAssetUploaded);
    syncEventBus.onSyncEvent("asset:failed", handleAssetFailed);
    syncEventBus.onSyncEvent("queue:started", handleQueueStarted);
    syncEventBus.onSyncEvent("queue:completed", handleQueueCompleted);
    syncEventBus.onSyncEvent("asset:uploading", handleAssetUploading);

    const queueManager = getQueueManager();
    const metricsSubscription = queueManager.getMetrics$().subscribe((m) => {
      setMetrics(m);
    });

    // Check network status
    const checkNetwork = async () => {
      const state = await Network.getNetworkStateAsync();
      const online =
        state.isConnected === true && state.isInternetReachable === true;

      // If coming back online from offline, reset failed items and trigger sync
      if (online && wasOffline.current) {
        await resetFailedAssets();
        setFailedCount(0);
        const queueManager = getQueueManager();
        await queueManager.processQueue();
      }

      wasOffline.current = !online;
      setIsOnline(online);
    };
    checkNetwork();
    const networkInterval = setInterval(checkNetwork, 5000);

    return () => {
      metricsSubscription.unsubscribe();
      clearInterval(networkInterval);
      syncEventBus.offSyncEvent("asset:uploaded", handleAssetUploaded);
      syncEventBus.offSyncEvent("asset:failed", handleAssetFailed);
      syncEventBus.offSyncEvent("queue:started", handleQueueStarted);
      syncEventBus.offSyncEvent("queue:completed", handleQueueCompleted);
      syncEventBus.offSyncEvent("asset:uploading", handleAssetUploading);
    };
  }, []);

  if (!metrics) {
    return null;
  }

  const getStatusColor = (): string => {
    if (!isOnline) return "#ff9800";
    if (isSyncing) return "#2196f3";
    if (failedCount > 0 || metrics.failed > 0) return "#f44336";
    if (metrics.totalQueued > 0 || metrics.inProgress > 0) return "#ff9800";
    return "#4caf50";
  };

  const getStatusText = (): string => {
    if (!isOnline) return "OFFLINE";
    if (isSyncing || metrics.inProgress > 0) return "SYNCING";
    if (failedCount > 0 || metrics.failed > 0)
      return `FAILED (${metrics.failed})`;
    if (metrics.totalQueued > 0) return `PENDING (${metrics.totalQueued})`;
    return "✓ SYNCED";
  };

  return (
    <View style={[styles.container, { backgroundColor: getStatusColor() }]}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {isSyncing && <ActivityIndicator size="small" color="#fff" />}
          <View style={styles.indicator} />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>

        <View style={styles.metricsSection}>
          <Text style={styles.metricText}>
            ↑{metrics.inProgress} ✓{metrics.completed}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  metricsSection: {
    flexDirection: "row",
    gap: 12,
  },
  metricText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
});
