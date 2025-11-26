import React from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
} from "react-native";
import type { LocalAssetRecord } from "../types";

interface Props {
  visible: boolean;
  image: LocalAssetRecord | null;
  onClose: () => void;
  formatDate: (ms: number) => string;
}

export default function ZoomModal({
  visible,
  image,
  onClose,
  formatDate,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.zoomContainer}>
        <TouchableOpacity
          style={styles.zoomOverlay}
          onPress={onClose}
          activeOpacity={1}
        >
          {image && (
            <View style={styles.zoomContent}>
              <Image
                style={styles.zoomImage}
                source={{
                  uri:
                    image.uri ||
                    `data:${image.mimeType};base64,${image.imageBase64}`,
                }}
                resizeMode="contain"
              />
              <View style={styles.zoomInfo}>
                <Text style={styles.zoomFilename} numberOfLines={2}>
                  {image.filename}
                </Text>
                {image.username && (
                  <Text style={styles.zoomMeta}>By: {image.username}</Text>
                )}
                <Text style={styles.zoomMeta}>
                  {formatDate(image.timestampMs)}
                </Text>
              </View>
              <Text style={styles.zoomCloseHint}>Tap to close</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  zoomContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  zoomContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 16,
  },
  zoomImage: {
    flex: 1,
    width: "100%",
    height: "70%",
  },
  zoomInfo: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    width: "100%",
  },
  zoomFilename: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  zoomMeta: {
    fontSize: 13,
    color: "#ccc",
    marginBottom: 4,
  },
  zoomCloseHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 16,
    fontStyle: "italic",
  },
});
