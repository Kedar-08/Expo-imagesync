import React, { useCallback, useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { LocalAssetRecord } from "../types";
import { useAuth } from "../context/AuthContext";
import { processAndQueueImage } from "../utils/imageHelpers";
import AssetItem from "../components/AssetItem";
import ZoomModal from "../components/ZoomModal";
import CameraModal from "../components/CameraModal";
import CaptureHeader from "../components/CaptureHeader";
import { useAssets } from "../hooks/useAssets";

interface CaptureScreenProps {
  onNavigateToUsers?: () => void;
  onNavigateToAssets?: () => void;
  currentScreen?: "capture" | "users" | "assets";
}

export default function CaptureScreen({
  onNavigateToUsers,
  onNavigateToAssets,
  currentScreen,
}: CaptureScreenProps) {
  const { logout, user, isAdmin, isSuperAdmin, isUser } = useAuth();
  const {
    items,
    syncingIds,
    failedIds,
    refreshing,
    onRefresh,
    handleRetry,
    handleDeleteAsset,
  } = useAssets(user, isAdmin, isSuperAdmin);

  const [showCamera, setShowCamera] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [selectedImage, setSelectedImage] = useState<LocalAssetRecord | null>(
    null
  );

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

  const handlePickerResult = useCallback(
    async (result: ImagePicker.ImagePickerResult) => {
      if (result.canceled || !result.assets || result.assets.length === 0)
        return;

      const asset = result.assets[0];
      const uri = asset.uri;

      try {
        await processAndQueueImage(uri, user, async () => {
          await onRefresh();
        });
      } catch (error) {
        console.error("Error processing image:", error);
      }
    },
    [onRefresh, user]
  );

  const handleCapture = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        console.log("Camera permission denied");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        allowsEditing: false,
      });

      await handlePickerResult(result);
    } catch (error) {
      console.error("Camera error:", error);
    }
  }, [handlePickerResult]);

  const handlePick = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    await handlePickerResult(result);
  }, [handlePickerResult]);

  const handleCameraCapture = useCallback(
    async (cameraRef: any) => {
      try {
        const photo = await cameraRef.takePictureAsync({ quality: 0.5 });
        if (photo?.uri) {
          await processAndQueueImage(photo.uri, user, async () => {
            await onRefresh();
          });
        }
      } catch (err: any) {
        console.warn("takePictureAsync error", err);
      }
    },
    [onRefresh, user]
  );

  return (
    <View style={styles.container}>
      <CaptureHeader
        user={user}
        isUser={isUser}
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
        currentScreen={currentScreen}
        onLogout={logout}
        onNavigateToUsers={onNavigateToUsers}
        onNavigateToAssets={onNavigateToAssets}
        onCapture={handleCapture}
        onPick={handlePick}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({ item }) => {
          const isSyncing = syncingIds.has(item.id);
          const isFailed = failedIds.has(item.id);
          return (
            <AssetItem
              item={item}
              isUser={isUser}
              isAdmin={isAdmin}
              isSuperAdmin={isSuperAdmin}
              isSyncing={isSyncing}
              isFailed={isFailed}
              onZoom={(it) => {
                setSelectedImage(it);
                setShowZoom(true);
              }}
              onRetry={handleRetry}
              onDelete={handleDeleteAsset}
              formatDate={formatDate}
            />
          );
        }}
      />

      <CameraModal
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />

      <ZoomModal
        visible={showZoom}
        image={selectedImage}
        onClose={() => setShowZoom(false)}
        formatDate={formatDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
