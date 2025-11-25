import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from "react-native";
import { getAllAssetsWithUsers, deleteAsset } from "../db/db";
import type { AssetWithUser } from "../db/db";
import type { AuthUser } from "../types";

interface AssetManagementScreenProps {
  onBack: () => void;
  onNavigateToUsers?: () => void;
  currentScreen?: "capture" | "users" | "assets";
  currentUser?: AuthUser | null;
}

export default function AssetManagementScreen({
  onBack,
  onNavigateToUsers,
  currentScreen,
  currentUser,
}: AssetManagementScreenProps) {
  const [assets, setAssets] = useState<AssetWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetWithUser | null>(
    null
  );
  const [showPreview, setShowPreview] = useState(false);

  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      const allAssets = await getAllAssetsWithUsers();
      setAssets(allAssets);
    } catch (error) {
      console.error("Error loading assets:", error);
      Alert.alert("Error", "Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const allAssets = await getAllAssetsWithUsers();
      setAssets(allAssets);
    } catch (error) {
      console.error("Error refreshing assets:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleDeleteAsset = (asset: AssetWithUser) => {
    Alert.alert(
      "Delete Image",
      `Delete image "${asset.filename}" uploaded by ${asset.username || "Unknown"}?`,
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              // Pass admin info if user is an admin
              if (
                currentUser &&
                (currentUser.role === "admin" ||
                  currentUser.role === "superadmin")
              ) {
                await deleteAsset(
                  asset.id,
                  parseInt(currentUser.id, 10),
                  currentUser.username
                );
              } else {
                await deleteAsset(asset.id);
              }
              await loadAssets();
              Alert.alert("Success", "Image has been deleted");
            } catch (error) {
              console.error("Error deleting asset:", error);
              Alert.alert("Error", "Failed to delete image");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const formatDate = (timestampMs: number) => {
    const date = new Date(timestampMs);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const formatSize = (bytes: number | null | undefined) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const renderAssetItem = ({ item }: { item: AssetWithUser }) => (
    <View style={styles.assetCard}>
      <TouchableOpacity
        style={styles.thumbnailContainer}
        onPress={() => {
          setSelectedAsset(item);
          setShowPreview(true);
        }}
      >
        {item.imageBase64 ? (
          <Image
            source={{ uri: `data:${item.mimeType};base64,${item.imageBase64}` }}
            style={styles.thumbnail}
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.assetInfo}>
        <Text style={styles.filename} numberOfLines={1}>
          {item.filename}
        </Text>
        <Text style={styles.uploadedBy}>By: {item.username || "Unknown"}</Text>
        <Text style={styles.metadata}>
          Size: {formatSize(item.fileSizeBytes)}
        </Text>
        <Text style={styles.metadata}>
          Date: {formatDate(item.timestampMs)}
        </Text>
        <View style={styles.statusContainer}>
          <Text
            style={[
              styles.status,
              item.status === "uploaded"
                ? styles.statusUploaded
                : styles.statusPending,
            ]}
          >
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteAsset(item)}
      >
        <Text style={styles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Asset Management</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.navButtonRow}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentScreen === "users" && styles.navButtonActive,
          ]}
          onPress={onNavigateToUsers}
        >
          <Text
            style={[
              styles.navButtonText,
              currentScreen === "users" && styles.navButtonTextActive,
            ]}
          >
            👥 Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentScreen === "assets" && styles.navButtonActive,
          ]}
          disabled
        >
          <Text
            style={[
              styles.navButtonText,
              currentScreen === "assets" && styles.navButtonTextActive,
            ]}
          >
            🖼️ Assets
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : assets.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No images found</Text>
        </View>
      ) : (
        <FlatList
          data={assets}
          renderItem={renderAssetItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal
        visible={showPreview}
        transparent={true}
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.previewContainer}>
          <TouchableOpacity
            style={styles.previewOverlay}
            onPress={() => setShowPreview(false)}
          >
            <View style={styles.previewContent}>
              {selectedAsset?.imageBase64 ? (
                <>
                  <Image
                    source={{
                      uri: `data:${selectedAsset.mimeType};base64,${selectedAsset.imageBase64}`,
                    }}
                    style={styles.fullImage}
                  />
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewTitle}>
                      {selectedAsset.filename}
                    </Text>
                    <Text style={styles.previewMeta}>
                      Uploaded by: {selectedAsset.username || "Unknown"}
                    </Text>
                    <Text style={styles.previewMeta}>
                      Date: {formatDate(selectedAsset.timestampMs)}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={styles.previewError}>No image to display</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  backButton: {
    padding: 8,
    width: 60,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  listContent: {
    padding: 12,
  },
  assetCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  placeholderText: {
    fontSize: 10,
    color: "#999",
  },
  assetInfo: {
    flex: 1,
  },
  filename: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  uploadedBy: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  metadata: {
    fontSize: 11,
    color: "#999",
    marginBottom: 2,
  },
  statusContainer: {
    marginTop: 6,
  },
  status: {
    fontSize: 10,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  statusUploaded: {
    backgroundColor: "#C8E6C9",
    color: "#2E7D32",
  },
  statusPending: {
    backgroundColor: "#FFE0B2",
    color: "#E65100",
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    backgroundColor: "#FFE8E8",
  },
  deleteButtonText: {
    fontSize: 18,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  previewContent: {
    width: "90%",
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
  },
  fullImage: {
    width: "100%",
    height: 400,
  },
  previewInfo: {
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  previewMeta: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  previewError: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    padding: 40,
  },
  navButtonRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    gap: 8,
  },
  navButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FFD700",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonActive: {
    backgroundColor: "#FF6B9D",
    shadowColor: "#FF6B9D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
  },
  navButtonTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
});
