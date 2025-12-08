import React, { useCallback, useState } from "react";
import { View, FlatList, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { LocalAssetRecord, PhotoCategory } from "../types";
import { useAuth } from "../context/AuthContext";
import { processAndQueueImage } from "../utils/imageHelpers";
import { deleteAsset } from "../db/db";
import AssetItem from "../components/AssetItem";
import ZoomModal from "../components/ZoomModal";
import CameraModal from "../components/CameraModal";
import CaptureHeader from "../components/CaptureHeader";
import CategoryPicker from "../components/CategoryPicker";
import { useAssets } from "../hooks/useAssets";

interface CaptureScreenProps {} // Simplified for POC - no navigation

export default function CaptureScreen({}: CaptureScreenProps) {
  const { logout, user } = useAuth();
  const { items, syncingIds, failedIds, refreshing, onRefresh, handleRetry } =
    useAssets(user, false, false); // No admin features for POC

  const [showCamera, setShowCamera] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [selectedImage, setSelectedImage] = useState<LocalAssetRecord | null>(
    null
  );
  const [selectedCategory, setSelectedCategory] =
    useState<PhotoCategory>("Site");
  const [filterCategory, setFilterCategory] = useState<PhotoCategory | null>(
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
        await processAndQueueImage(
          uri,
          user,
          async () => {
            await onRefresh();
          },
          selectedCategory
        );
      } catch (error) {
        console.error("Error processing image:", error);
      }
    },
    [onRefresh, user, selectedCategory]
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

  const handleDelete = useCallback(
    async (id: number, filename: string) => {
      Alert.alert(
        "Delete Photo",
        `Are you sure you want to delete ${filename}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteAsset(id);
                await onRefresh();
              } catch (error) {
                console.error("Error deleting asset:", error);
                Alert.alert("Error", "Failed to delete photo");
              }
            },
          },
        ]
      );
    },
    [onRefresh]
  );

  const handleCameraCapture = useCallback(
    async (cameraRef: any) => {
      try {
        const photo = await cameraRef.takePictureAsync({ quality: 0.5 });
        if (photo?.uri) {
          await processAndQueueImage(
            photo.uri,
            user,
            async () => {
              await onRefresh();
            },
            selectedCategory
          );
        }
      } catch (err: any) {
        console.warn("takePictureAsync error", err);
      }
    },
    [onRefresh, user, selectedCategory]
  );

  return (
    <View style={styles.container}>
      <CaptureHeader
        user={user}
        isUser={true}
        isAdmin={false}
        isSuperAdmin={false}
        currentScreen="capture"
        onLogout={logout}
        onNavigateToUsers={undefined}
        onNavigateToAssets={undefined}
        onCapture={handleCapture}
        onPick={handlePick}
      />

      <CategoryPicker
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        filterCategory={filterCategory}
        onFilterCategory={setFilterCategory}
      />

      <FlatList
        data={
          filterCategory
            ? items.filter((item) => item.photoCategory === filterCategory)
            : items
        }
        keyExtractor={(item) => String(item.id)}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({ item }) => {
          const isSyncing = syncingIds.has(item.id);
          const isFailed = failedIds.has(item.id);
          return (
            <AssetItem
              item={item}
              isUser={true}
              isAdmin={false}
              isSuperAdmin={false}
              isSyncing={isSyncing}
              isFailed={isFailed}
              onZoom={(it) => {
                setSelectedImage(it);
                setShowZoom(true);
              }}
              onRetry={handleRetry}
              onDelete={handleDelete}
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
