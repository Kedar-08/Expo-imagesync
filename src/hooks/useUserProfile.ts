import { useState, useCallback, useEffect } from "react";
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
import type { StoredUser } from "../db/users";
import type { AuthUser } from "../types";

export function useUserProfile(user: StoredUser, currentUser: AuthUser | null) {
  const [images, setImages] = useState<AssetWithUser[]>([]);
  const [promotions, setPromotions] = useState<AdminPromotion[]>([]);
  const [deletions, setDeletions] = useState<DeletedAssetRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      if (user.role === "user") {
        const userImages = await getAssetsByUserId(user.id);
        setImages(userImages);
      } else if (user.role === "admin") {
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
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user.id, user.role, currentUser]);

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
    promotions,
    deletions,
    loading,
    refreshing,
    onRefresh,
  };
}
