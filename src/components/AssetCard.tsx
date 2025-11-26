import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import type { AssetWithUser } from "../db/db";
import { formatFileSize } from "../utils/dateHelpers";
import { assetCardStyles } from "../utils/styleHelpers";

interface AssetCardProps {
  asset: AssetWithUser;
  onPreview: (asset: AssetWithUser) => void;
  onDelete: (asset: AssetWithUser) => void;
}

function AssetCard({ asset, onPreview, onDelete }: AssetCardProps) {
  const styles = assetCardStyles();

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.thumbWrap}
        onPress={() => onPreview(asset)}
        activeOpacity={0.8}
      >
        {asset.imageBase64 ? (
          <Image
            source={{
              uri: `data:${asset.mimeType};base64,${asset.imageBase64}`,
            }}
            style={styles.thumb}
          />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.filename} numberOfLines={1}>
          {asset.filename}
        </Text>
        <Text style={styles.meta}>By: {asset.username || "Unknown"}</Text>
        <Text style={styles.meta}>
          Size: {formatFileSize(asset.fileSizeBytes)}
        </Text>
        <Text style={styles.meta}>
          Date: {new Date(asset.timestampMs).toLocaleDateString()}
        </Text>
        <View style={styles.statusWrap}>
          <Text
            style={[
              styles.status,
              asset.status === "uploaded" ? styles.uploaded : styles.pending,
            ]}
          >
            {asset.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.delete} onPress={() => onDelete(asset)}>
        <Text style={styles.deleteText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
}

export default React.memo(AssetCard);
