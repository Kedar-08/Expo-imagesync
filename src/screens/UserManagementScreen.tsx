import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { getAllUsers, deleteUser, updateUserRole } from "../db/users";
import type { StoredUser } from "../db/users";
import type { AuthUser } from "../types";
import UserProfileScreen from "./UserProfileScreen";

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
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] =
    useState<StoredUser | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      Alert.alert("Error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error("Error refreshing users:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handlePromoteUser = (user: StoredUser) => {
    if (isSuperAdmin) {
      // Super Admin can promote user to admin or admin to user (demote)
      if (user.role === "admin") {
        Alert.alert(
          "Demote Admin",
          `Demote ${user.username} back to regular user?`,
          [
            { text: "Cancel", onPress: () => {}, style: "cancel" },
            {
              text: "Demote",
              onPress: async () => {
                try {
                  await updateUserRole(user.id, "user");
                  await loadUsers();
                  Alert.alert(
                    "Success",
                    `${user.username} is now a regular user`
                  );
                } catch (error) {
                  console.error("Error demoting user:", error);
                  Alert.alert("Error", "Failed to demote user");
                }
              },
              style: "destructive",
            },
          ]
        );
      } else if (user.role === "user") {
        Alert.alert("Promote User", `Promote ${user.username} to admin?`, [
          { text: "Cancel", onPress: () => {}, style: "cancel" },
          {
            text: "Promote",
            onPress: async () => {
              try {
                await updateUserRole(
                  user.id,
                  "admin",
                  parseInt(currentUser.id, 10),
                  currentUser.username
                );
                await loadUsers();
                Alert.alert("Success", `${user.username} is now an admin`);
              } catch (error) {
                console.error("Error promoting user:", error);
                Alert.alert("Error", "Failed to promote user");
              }
            },
            style: "default",
          },
        ]);
      }
    } else {
      // Regular admin can only promote users to admin, but NOT Super Admin
      if (user.role === "superadmin") {
        Alert.alert(
          "Not Allowed",
          "Super Admin is protected and cannot be modified"
        );
        return;
      }

      if (user.role === "admin") {
        Alert.alert("Info", "User is already an admin");
        return;
      }

      Alert.alert(
        "Promote User",
        `Promote ${user.username} to admin? This cannot be revoked.`,
        [
          { text: "Cancel", onPress: () => {}, style: "cancel" },
          {
            text: "Promote",
            onPress: async () => {
              try {
                await updateUserRole(
                  user.id,
                  "admin",
                  parseInt(currentUser.id, 10),
                  currentUser.username
                );
                await loadUsers();
                Alert.alert("Success", `${user.username} is now an admin`);
              } catch (error) {
                console.error("Error promoting user:", error);
                Alert.alert("Error", "Failed to promote user");
              }
            },
            style: "default",
          },
        ]
      );
    }
  };

  const handleDeleteUser = (user: StoredUser) => {
    // Prevent deletion of current user
    if (user.id === parseInt(currentUser.id, 10)) {
      Alert.alert("Cannot Delete", "You cannot delete your own account");
      return;
    }

    // Prevent deletion of Super Admin
    if (user.role === "superadmin") {
      Alert.alert(
        "Not Allowed",
        "Super Admin is supreme and cannot be deleted"
      );
      return;
    }

    // Only Super Admin can delete users
    if (!isSuperAdmin) {
      Alert.alert("Not Allowed", "Only Super Admin can delete users");
      return;
    }

    // Super Admin can delete any user (admin or regular)
    Alert.alert(
      "Delete User",
      `Are you sure you want to delete ${user.username}? This action cannot be undone.`,
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await deleteUser(user.id);
              await loadUsers();
              Alert.alert("Success", `${user.username} has been deleted`);
            } catch (error) {
              console.error("Error deleting user:", error);
              Alert.alert("Error", "Failed to delete user");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const renderUserItem = ({ item }: { item: StoredUser }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.email} numberOfLines={1}>
          {item.email}
        </Text>
        <View style={styles.roleContainer}>
          <Text
            style={[
              styles.role,
              item.role === "superadmin"
                ? styles.roleSuperAdmin
                : item.role === "admin"
                  ? styles.roleAdmin
                  : styles.roleUser,
            ]}
          >
            {item.role.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        {/* Promote/Demote Button - Super Admin */}
        {isSuperAdmin && (
          <>
            {item.role === "user" &&
              item.id !== parseInt(currentUser.id, 10) && (
                <TouchableOpacity
                  style={[styles.button, styles.promoteButton]}
                  onPress={() => handlePromoteUser(item)}
                >
                  <Text style={styles.buttonText}>Promote</Text>
                </TouchableOpacity>
              )}
            {item.role === "admin" &&
              item.id !== parseInt(currentUser.id, 10) && (
                <TouchableOpacity
                  style={[styles.button, styles.demoteButton]}
                  onPress={() => handlePromoteUser(item)}
                >
                  <Text style={styles.buttonText}>Demote</Text>
                </TouchableOpacity>
              )}
          </>
        )}

        {/* Promote/Demote Button - Regular Admin */}
        {!isSuperAdmin && item.role === "user" && (
          <TouchableOpacity
            style={[styles.button, styles.promoteButton]}
            onPress={() => handlePromoteUser(item)}
          >
            <Text style={styles.buttonText}>Promote</Text>
          </TouchableOpacity>
        )}

        {/* Remove Button - Super Admin only */}
        {isSuperAdmin && item.id !== parseInt(currentUser.id, 10) && (
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={() => handleDeleteUser(item)}
          >
            <Text style={styles.buttonText}>Remove</Text>
          </TouchableOpacity>
        )}

        {/* Profile Button */}
        {item.role !== "superadmin" &&
          item.id !== parseInt(currentUser.id, 10) && (
            <TouchableOpacity
              style={[styles.button, styles.viewButton]}
              onPress={() => setSelectedUserProfile(item)}
            >
              <Text style={styles.buttonText}>Profile</Text>
            </TouchableOpacity>
          )}
      </View>
    </View>
  );

  return selectedUserProfile ? (
    <UserProfileScreen
      user={selectedUserProfile}
      onBack={() => setSelectedUserProfile(null)}
      currentUser={currentUser}
    />
  ) : (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>User Management</Text>
        <View style={{ width: 60 }} />
      </View>

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

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : users.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
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
  userCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  buttonContainer: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  promoteButton: {
    backgroundColor: "#4CAF50",
  },
  demoteButton: {
    backgroundColor: "#FF9800",
  },
  deleteButton: {
    backgroundColor: "#FF6B6B",
  },
  viewButton: {
    backgroundColor: "#2196F3",
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  disabledButton: {
    backgroundColor: "#BDBDBD",
  },
  disabledButtonText: {
    color: "#757575",
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
