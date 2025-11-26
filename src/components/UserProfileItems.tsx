import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import type {
  AssetWithUser,
  AdminPromotion,
  DeletedAssetRecord,
} from "../db/db";
import { formatDate } from "../utils/dateHelpers";
import { listItemStyles } from "../utils/styleHelpers";

interface ImageItemProps {
  item: AssetWithUser;
  onPress: (item: AssetWithUser) => void;
}

export function ImageItem({ item, onPress }: ImageItemProps) {
  const styles = listItemStyles();
  return (
    <View style={styles.imageItem}>
      <TouchableOpacity onPress={() => onPress(item)}>
        <Image
          source={{ uri: `data:${item.mimeType};base64,${item.imageBase64}` }}
          style={styles.imageThumbnail}
        />
      </TouchableOpacity>
      <View style={styles.imageInfo}>
        <Text numberOfLines={1} style={styles.filename}>
          {item.filename}
        </Text>
        <Text style={styles.timestamp}>{formatDate(item.timestampMs)}</Text>
        <Text style={styles.fileSize}>
          {item.fileSizeBytes
            ? `${(item.fileSizeBytes / 1024).toFixed(0)}kb`
            : "N/A"}
        </Text>
      </View>
    </View>
  );
}

interface PromotionItemProps {
  item: AdminPromotion;
}

export function PromotionItem({ item }: PromotionItemProps) {
  const styles = listItemStyles();
  return (
    <View style={styles.actionItem}>
      <View style={styles.actionIcon}>
        <Text style={styles.actionIconText}>✓</Text>
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>
          Promoted{" "}
          <Text style={styles.actionUsername}>{item.promotedUsername}</Text> to
          admin
        </Text>
        {item.promotedUserEmail && (
          <Text style={styles.actionSubtext}>
            email: {item.promotedUserEmail}
          </Text>
        )}
        <Text style={styles.actionDate}>
          {formatDate(item.promotionTimestampMs)}
        </Text>
      </View>
    </View>
  );
}

interface DeletionItemProps {
  item: DeletedAssetRecord;
}

export function DeletionItem({ item }: DeletionItemProps) {
  const styles = listItemStyles();
  return (
    <View style={styles.actionItem}>
      <View style={[styles.actionIcon, styles.deleteIcon]}>
        <Text style={styles.actionIconText}>✕</Text>
      </View>
      {item.imageBase64 && item.mimeType && (
        <Image
          source={{ uri: `data:${item.mimeType};base64,${item.imageBase64}` }}
          style={styles.deletedImageThumbnail}
        />
      )}
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>
          Deleted{" "}
          <Text style={styles.actionFilename}>{item.assetFilename}</Text>
        </Text>
        {item.originalUploaderUsername && (
          <Text style={styles.actionSubtext}>
            Originally uploaded by {item.originalUploaderUsername}
          </Text>
        )}
        <Text style={styles.actionDate}>
          {formatDate(item.deletionTimestampMs)}
        </Text>
      </View>
    </View>
  );
}
