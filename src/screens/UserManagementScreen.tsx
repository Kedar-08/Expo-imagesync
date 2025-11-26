import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useUserManagement } from "../hooks/useUserManagement";
import UserCard from "../components/UserCard";
import UserProfileScreen from "./UserProfileScreen";
import { userManagementStyles } from "../utils/styleHelpers";
import type { AuthUser } from "../types";
import type { StoredUser } from "../db/users";

interface UserManagementScreenProps {
  onBack: () => void;
  onNavigateToAssets?: () => void;
  currentUser: AuthUser;
  isSuperAdmin: boolean;
  currentScreen?: "capture" | "users" | "assets";
}

export default function UserManagementScreen({
  onBack,
  onNavigateToAssets,
  currentUser,
  isSuperAdmin,
  currentScreen,
}: UserManagementScreenProps) {
  const {
    users,
    loading,
    refreshing,
    onRefresh,
    handlePromoteUser,
    handleDeleteUser,
  } = useUserManagement();
  const [selectedUserProfile, setSelectedUserProfile] =
    useState<StoredUser | null>(null);

  const styles = userManagementStyles();

  const handleViewProfile = useCallback((user: StoredUser) => {
    setSelectedUserProfile(user);
  }, []);

  const handlePromoteCallback = useCallback(
    (user: StoredUser) => {
      handlePromoteUser(
        user,
        { id: currentUser.id, username: currentUser.username },
        isSuperAdmin
      );
    },
    [handlePromoteUser, currentUser.id, currentUser.username, isSuperAdmin]
  );

  const handleDeleteCallback = useCallback(
    (user: StoredUser) => {
      handleDeleteUser(user, parseInt(currentUser.id, 10), isSuperAdmin);
    },
    [handleDeleteUser, currentUser.id, isSuperAdmin]
  );

  const renderUserItem = ({ item }: { item: StoredUser }) => (
    <UserCard
      user={item}
      currentUserId={parseInt(currentUser.id, 10)}
      isSuperAdmin={isSuperAdmin}
      onPromote={handlePromoteCallback}
      onDelete={handleDeleteCallback}
      onViewProfile={handleViewProfile}
    />
  );

  if (selectedUserProfile) {
    return (
      <UserProfileScreen
        user={selectedUserProfile}
        onBack={() => setSelectedUserProfile(null)}
        currentUser={currentUser}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Users</Text>
        <View style={{ width: 60 }} />
      </View>

      {onNavigateToAssets && (
        <View style={styles.navButtonRow}>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentScreen === "users" && styles.navButtonActive,
            ]}
            disabled
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
            onPress={onNavigateToAssets}
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
      )}

      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {!loading && users.length === 0 && (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      )}

      {!loading && users.length > 0 && (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}
