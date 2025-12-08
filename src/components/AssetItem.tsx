import React, { memo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import type { LocalAssetRecord } from "../types";
import { buttonStyle, buttonTextStyle } from "../utils/styleHelpers";

interface Props {
  item: LocalAssetRecord;
  isUser?: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  isSyncing?: boolean;
  isFailed?: boolean;
  onZoom: (item: LocalAssetRecord) => void;
  onRetry: (id: number) => Promise<void>;
  onDelete?: (id: number, filename: string) => Promise<void>; // Optional for POC
  formatDate: (ts: number) => string;
}

export default memo(function AssetItem({
  item,
  isUser,
  isAdmin,
  isSuperAdmin,
  isSyncing,
  isFailed,
  onZoom,
  onRetry,
  onDelete,
  formatDate,
}: Props) {
  return (
    <View style={styles.item}>
      <TouchableOpacity
        style={styles.thumbContainer}
        onPress={() => onZoom(item)}
      >
        <Image
          style={styles.thumb}
          source={{
            uri: item.uri || `data:${item.mimeType};base64,${item.imageBase64}`,
          }}
        />
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Text numberOfLines={1}>{item.filename}</Text>
        {item.username && (
          <Text style={styles.uploaderUsername}>By: {item.username}</Text>
        )}
        {item.photoCategory && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {item.photoCategory === "Circuit"
                ? "⚡"
                : item.photoCategory === "Space"
                  ? "📐"
                  : item.photoCategory === "Power"
                    ? "🔌"
                    : "📍"}{" "}
              {item.photoCategory}
            </Text>
          </View>
        )}
        <Text style={styles.timestamp}>{formatDate(item.timestampMs)}</Text>

        <View style={styles.statusRow}>
          <Text
            style={[
              styles.statusText,
              {
                color: isFailed
                  ? "#f44336"
                  : isSyncing
                    ? "#2196f3"
                    : item.status === "uploaded"
                      ? "#4caf50"
                      : "#ff9800",
              },
            ]}
          >
            {isSyncing
              ? "⟳ Uploading"
              : isFailed
                ? "✗ Failed"
                : item.status === "uploaded"
                  ? "✓ Synced"
                  : `Pending`}
          </Text>
          {item.serverId && (
            <Text style={styles.serverId}>#{item.serverId.slice(0, 8)}</Text>
          )}
          {item.fileSizeBytes && (
            <Text style={styles.fileSizeText}>
              {(item.fileSizeBytes / 1024).toFixed(0)}kb
            </Text>
          )}
        </View>

        {isSyncing && <ActivityIndicator size="small" color="#2196f3" />}
        {item.retries > 0 && (
          <Text style={styles.retryText}>Retries: {item.retries}</Text>
        )}

        {isUser && item.status !== "uploaded" && !isSyncing && (
          <TouchableOpacity
            style={buttonStyle("#2196f3")}
            onPress={() => onRetry(item.id)}
          >
            <Text style={buttonTextStyle()}>🔄 Retry</Text>
          </TouchableOpacity>
        )}

        {isUser && onDelete && !isSyncing && (
          <TouchableOpacity
            style={buttonStyle("#f44336")}
            onPress={() => onDelete(item.id, item.filename)}
          >
            <Text style={buttonTextStyle()}>🗑️ Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    gap: 12,
  },
  thumbContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  serverId: {
    fontSize: 12,
    color: "#666",
  },
  fileSizeText: {
    fontSize: 12,
    color: "#999",
  },
  uploaderUsername: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  retryText: {
    fontSize: 12,
    color: "#ff9800",
    marginTop: 2,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  categoryText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
});
