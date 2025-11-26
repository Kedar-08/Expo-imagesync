import React from "react";
import { Modal, View, Image, Text, TouchableOpacity } from "react-native";
import type { AssetWithUser } from "../db/db";
import { formatDateLong } from "../utils/dateHelpers";
import { assetPreviewStyles } from "../utils/styleHelpers";

interface AssetPreviewModalProps {
  visible: boolean;
  asset: AssetWithUser | null;
  onClose: () => void;
}

function AssetPreviewModal({
  visible,
  asset,
  onClose,
}: AssetPreviewModalProps) {
  const styles = assetPreviewStyles();

  return (
    <Modal
      visible={visible}
      transparent
      onRequestClose={onClose}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.content}>
          {asset?.imageBase64 ? (
            <>
              <Image
                source={{
                  uri: `data:${asset.mimeType};base64,${asset.imageBase64}`,
                }}
                style={styles.image}
              />
              <View style={styles.info}>
                <Text style={styles.title}>{asset.filename}</Text>
                <Text style={styles.meta}>
                  Uploaded by: {asset.username || "Unknown"}
                </Text>
                <Text style={styles.meta}>
                  Date: {formatDateLong(asset.timestampMs)}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.noImage}>No image to display</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default React.memo(AssetPreviewModal);
