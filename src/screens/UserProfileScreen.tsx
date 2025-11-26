import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import type { StoredUser } from "../db/users";
import type { AuthUser } from "../types";
import { useUserProfile } from "../hooks/useUserProfile";
import {
  ImageItem,
  PromotionItem,
  DeletionItem,
} from "../components/UserProfileItems";
import {
  userProfileStyles,
  userCardStyles,
  profileModalStyles,
} from "../utils/styleHelpers";

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
  const { images, promotions, deletions, loading, refreshing, onRefresh } =
    useUserProfile(user, currentUser || null);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const pStyles = userProfileStyles();
  const cStyles = userCardStyles();
  const mStyles = profileModalStyles();

  const handleImagePress = (item: any) => {
    setSelectedImage(item);
    setShowImageModal(true);
  };

  const isAdminUser = user.role !== "user";
  const canViewAdminActivity =
    currentUser &&
    (currentUser.role === "superadmin" || currentUser.role === "admin") &&
    user.role === "admin";

  return (
    <View style={pStyles.container}>
      <View style={pStyles.header}>
        <TouchableOpacity onPress={onBack} style={pStyles.backButton}>
          <Text style={pStyles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={pStyles.title}>User Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={cStyles.card}>
        <View style={cStyles.info}>
          <Text style={cStyles.username}>{user.username}</Text>
          <Text style={cStyles.email}>{user.email}</Text>
          <View style={cStyles.roleContainer}>
            <Text
              style={[
                cStyles.role,
                user.role === "superadmin"
                  ? cStyles.roleSuperAdmin
                  : user.role === "admin"
                    ? cStyles.roleAdmin
                    : cStyles.roleUser,
              ]}
            >
              {user.role.toUpperCase()}
            </Text>
          </View>
        </View>
        {!isAdminUser && (
          <View style={cStyles.statsContainer}>
            <View style={cStyles.stat}>
              <Text style={cStyles.statNumber}>{images.length}</Text>
              <Text style={cStyles.statLabel}>Images</Text>
            </View>
          </View>
        )}
      </View>

      {!isAdminUser ? (
        <>
          <View style={pStyles.imagesHeader}>
            <Text style={pStyles.imagesTitle}>Uploaded Images</Text>
          </View>
          {loading && !refreshing ? (
            <View style={pStyles.centerContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : images.length === 0 ? (
            <View style={pStyles.centerContainer}>
              <Text style={pStyles.emptyText}>No images uploaded</Text>
            </View>
          ) : (
            <FlatList
              data={images}
              renderItem={({ item }) => (
                <ImageItem item={item} onPress={handleImagePress} />
              )}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={pStyles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
        </>
      ) : canViewAdminActivity ? (
        <>
          {promotions.length > 0 && (
            <>
              <View style={pStyles.imagesHeader}>
                <Text style={pStyles.imagesTitle}>
                  Promotions by this Admin
                </Text>
              </View>
              <FlatList
                data={promotions}
                renderItem={({ item }) => <PromotionItem item={item} />}
                keyExtractor={(item) => `promo-${item.id}`}
                scrollEnabled={false}
              />
            </>
          )}
          {deletions.length > 0 && (
            <>
              <View style={pStyles.imagesHeader}>
                <Text style={pStyles.imagesTitle}>
                  Images Deleted by this Admin
                </Text>
              </View>
              <FlatList
                data={deletions}
                renderItem={({ item }) => <DeletionItem item={item} />}
                keyExtractor={(item) => `del-${item.id}`}
                scrollEnabled={false}
              />
            </>
          )}
          {promotions.length === 0 && deletions.length === 0 && (
            <View style={pStyles.centerContainer}>
              <Text style={pStyles.emptyText}>No admin activity recorded</Text>
            </View>
          )}
        </>
      ) : (
        <View style={pStyles.centerContainer}>
          <Text style={pStyles.emptyText}>
            {user.role === "admin"
              ? "Admins cannot upload images"
              : "Super Admin account"}
          </Text>
        </View>
      )}

      {showImageModal && selectedImage && (
        <View style={mStyles.modal}>
          <TouchableOpacity
            style={mStyles.modalOverlay}
            onPress={() => setShowImageModal(false)}
          >
            <View style={mStyles.modalContent}>
              <Image
                source={{
                  uri: `data:${selectedImage.mimeType};base64,${selectedImage.imageBase64}`,
                }}
                style={mStyles.modalImage}
                resizeMode="contain"
              />
              <View style={mStyles.modalInfo}>
                <Text style={mStyles.modalFilename} numberOfLines={2}>
                  {selectedImage.filename}
                </Text>
                <Text style={mStyles.modalDate}>
                  {new Date(selectedImage.timestampMs).toLocaleString()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
