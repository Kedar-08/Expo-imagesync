import { useState, useCallback, useEffect } from "react";
import { getAssetsByUserId } from "../db/db";
import type { AssetWithUser } from "../db/db";
import type { StoredUser } from "../db/users";

export function useUserProfile(user: StoredUser) {
  const [images, setImages] = useState<AssetWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      // POC: All users are site_auditors, just load their images
      const userImages = await getAssetsByUserId(user.id);
      setImages(userImages);
      // Admin features disabled for POC
    } catch (error) {
      console.error("Error loading user data:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadUserData();
    } finally {
      setRefreshing(false);
    }
  }, [loadUserData]);

  return {
    images,
    loading,
    refreshing,
    onRefresh,
  };
}
