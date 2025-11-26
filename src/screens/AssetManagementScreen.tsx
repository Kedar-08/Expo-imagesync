import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { getAllAssetsWithUsers, deleteAsset } from "../db/db";
import type { AssetWithUser } from "../db/db";
import type { AuthUser } from "../types";
import AssetCard from "../components/AssetCard";
import AssetPreviewModal from "../components/AssetPreviewModal";
import { assetManagementStyles } from "../utils/styleHelpers";

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

  const styles = assetManagementStyles();

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
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
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

  const renderAssetItem = ({ item }: { item: AssetWithUser }) => (
    <AssetCard
      asset={item}
      onPreview={(a) => {
        setSelectedAsset(a);
        setShowPreview(true);
      }}
      onDelete={handleDeleteAsset}
    />
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

      <AssetPreviewModal
        visible={showPreview}
        asset={selectedAsset}
        onClose={() => setShowPreview(false)}
      />
    </View>
  );
}
