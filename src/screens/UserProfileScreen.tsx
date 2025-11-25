import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import type { StoredUser } from "../db/users";
import {
  getAssetsByUserId,
  getAdminPromotions,
  getDeletedAssetsByAdmin,
} from "../db/db";
import type {
  AssetWithUser,
  AdminPromotion,
  DeletedAssetRecord,
} from "../db/db";
import type { AuthUser } from "../types";

interface UserProfileScreenProps {
  user: StoredUser;
  onBack: () => void;
  currentUser?: AuthUser | null;
}

export default function UserProfileScreen({
  user,
  onBack,
  currentUser,
}: UserProfileScreenProps) {
  const [images, setImages] = useState<AssetWithUser[]>([]);
  const [promotions, setPromotions] = useState<AdminPromotion[]>([]);
  const [deletions, setDeletions] = useState<DeletedAssetRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<AssetWithUser | null>(
    null
  );
  const [showImageModal, setShowImageModal] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      // Load images for regular users
      if (user.role === "user") {
        const userImages = await getAssetsByUserId(user.id);
        setImages(userImages);
      } else if (user.role === "admin") {
        // Load promotions and deletions for admins (if current user is Super Admin or Admin)
        if (
          currentUser &&
          (currentUser.role === "superadmin" || currentUser.role === "admin")
        ) {
          const adminPromotions = await getAdminPromotions(user.id);
          const adminDeletions = await getDeletedAssetsByAdmin(user.id);
          setPromotions(adminPromotions);
          setDeletions(adminDeletions);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      Alert.alert("Error", "Failed to load user data");
    } finally {
      setLoading(false);
    }
  }, [user.id, user.role, currentUser]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  }, [loadUserData]);

  const formatDate = (timestampMs: number) => {
    const date = new Date(timestampMs);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderPromotionItem = ({ item }: { item: AdminPromotion }) => (
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

  const renderDeletionItem = ({ item }: { item: DeletedAssetRecord }) => (
    <View style={styles.actionItem}>
      <View style={[styles.actionIcon, styles.deleteIcon]}>
        <Text style={styles.actionIconText}>✕</Text>
      </View>
      {item.imageBase64 && item.mimeType && (
        <Image
          source={{
            uri: `data:${item.mimeType};base64,${item.imageBase64}`,
          }}
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

  const renderImageItem = ({ item }: { item: AssetWithUser }) => (
    <View style={styles.imageItem}>
      <TouchableOpacity
        onPress={() => {
          setSelectedImage(item);
          setShowImageModal(true);
        }}
      >
        <Image
          source={{
            uri: `data:${item.mimeType};base64,${item.imageBase64}`,
          }}
          style={styles.imageThumbnail}
        />
      </TouchableOpacity>
      <View style={styles.imageInfo}>
        <Text numberOfLines={1} style={styles.filename}>
          {item.filename}
        </Text>
        <Text style={styles.timestamp}>{formatDate(item.timestampMs)}</Text>
        {item.fileSizeBytes ? (
          <Text style={styles.fileSize}>
            {(item.fileSizeBytes / 1024).toFixed(0)}kb
          </Text>
        ) : (
          <Text style={styles.fileSize}>Size: N/A</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>User Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* User Info Card */}
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.roleContainer}>
            <Text
              style={[
                styles.role,
                user.role === "superadmin"
                  ? styles.roleSuperAdmin
                  : user.role === "admin"
                    ? styles.roleAdmin
                    : styles.roleUser,
              ]}
            >
              {user.role.toUpperCase()}
            </Text>
          </View>
        </View>
        {/* Show stats only for regular users */}
        {user.role === "user" && (
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{images.length}</Text>
              <Text style={styles.statLabel}>Images</Text>
            </View>
          </View>
        )}
      </View>

      {/* Images Section - Only for regular users */}
      {user.role === "user" && (
        <>
          <View style={styles.imagesHeader}>
            <Text style={styles.imagesTitle}>Uploaded Images</Text>
          </View>

          {loading && !refreshing ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : images.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No images uploaded</Text>
            </View>
          ) : (
            <FlatList
              data={images}
              renderItem={renderImageItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
        </>
      )}

      {/* Admin/SuperAdmin info message */}
      {user.role !== "user" && (
        <>
          {/* Show admin activity if current user is Admin or Super Admin viewing an admin profile */}
          {currentUser &&
          (currentUser.role === "superadmin" || currentUser.role === "admin") &&
          user.role === "admin" ? (
            <>
              {/* Promotions Section */}
              {promotions.length > 0 && (
                <>
                  <View style={styles.imagesHeader}>
                    <Text style={styles.imagesTitle}>
                      Promotions by this Admin
                    </Text>
                  </View>
                  <FlatList
                    data={promotions}
                    renderItem={renderPromotionItem}
                    keyExtractor={(item) => `promotion-${item.id}`}
                    contentContainerStyle={styles.listContent}
                    scrollEnabled={false}
                  />
                </>
              )}

              {/* Deletions Section */}
              {deletions.length > 0 && (
                <>
                  <View style={styles.imagesHeader}>
                    <Text style={styles.imagesTitle}>
                      Images Deleted by this Admin
                    </Text>
                  </View>
                  <FlatList
                    data={deletions}
                    renderItem={renderDeletionItem}
                    keyExtractor={(item) => `deletion-${item.id}`}
                    contentContainerStyle={styles.listContent}
                    scrollEnabled={false}
                  />
                </>
              )}

              {/* No activity message */}
              {promotions.length === 0 && deletions.length === 0 && (
                <View style={styles.centerContainer}>
                  <Text style={styles.emptyText}>
                    No admin activity recorded
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>
                {user.role === "admin"
                  ? "Admins cannot upload images"
                  : "Super Admin account"}
              </Text>
            </View>
          )}
        </>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <View style={styles.modal}>
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setShowImageModal(false)}
          >
            <View style={styles.modalContent}>
              <Image
                source={{
                  uri: `data:${selectedImage.mimeType};base64,${selectedImage.imageBase64}`,
                }}
                style={styles.modalImage}
                resizeMode="contain"
              />
              <View style={styles.modalInfo}>
                <Text style={styles.modalFilename} numberOfLines={2}>
                  {selectedImage.filename}
                </Text>
                <Text style={styles.modalDate}>
                  {formatDate(selectedImage.timestampMs)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}
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
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  userCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  roleContainer: {
    alignSelf: "flex-start",
  },
  role: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleAdmin: {
    backgroundColor: "#FFD700",
    color: "#000",
  },
  roleSuperAdmin: {
    backgroundColor: "#FF6B9D",
    color: "#fff",
  },
  roleUser: {
    backgroundColor: "#E8F4F8",
    color: "#0277BD",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 16,
  },
  stat: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#007AFF",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  imagesHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  imagesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  gridContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  gridRow: {
    justifyContent: "space-between",
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  imageItem: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  imageThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#f0f0f0",
  },
  deletedImageThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: "#f0f0f0",
  },
  imageInfo: {
    flex: 1,
    justifyContent: "center",
  },
  filename: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 11,
    color: "#666",
  },
  imageContainer: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 8,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#999",
    fontSize: 12,
  },
  imageMeta: {
    paddingHorizontal: 8,
    paddingTop: 6,
    fontSize: 12,
    fontWeight: "500",
    color: "#000",
  },
  imageDate: {
    paddingHorizontal: 8,
    paddingBottom: 6,
    fontSize: 11,
    color: "#999",
  },
  listContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
  modal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  modalContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 16,
  },
  modalImage: {
    flex: 1,
    width: "100%",
    height: "70%",
  },
  modalInfo: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    width: "100%",
  },
  modalFilename: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  modalDate: {
    fontSize: 13,
    color: "#ccc",
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  deleteIcon: {
    backgroundColor: "#FFEBEE",
    borderLeftColor: "#F44336",
  },
  actionIconText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  actionUsername: {
    fontWeight: "700",
    color: "#2196F3",
  },
  actionFilename: {
    fontWeight: "700",
    color: "#F44336",
  },
  actionSubtext: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  actionDate: {
    fontSize: 12,
    color: "#999",
  },
});
