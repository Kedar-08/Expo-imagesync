import { useState, useCallback, useEffect } from "react";
import { Alert } from "react-native";
import { getAllUsers, deleteUser, updateUserRole } from "../db/users";
import type { StoredUser } from "../db/users";

interface UseUserManagementReturn {
  users: StoredUser[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  handlePromoteUser: (
    user: StoredUser,
    currentUser: { id: string; username: string },
    isSuperAdmin: boolean
  ) => void;
  handleDeleteUser: (
    user: StoredUser,
    currentUserId: number,
    isSuperAdmin: boolean
  ) => void;
}

export const useUserManagement = (): UseUserManagementReturn => {
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error("Error refreshing users:", err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handlePromoteUser = useCallback(
    (
      user: StoredUser,
      currentUser: { id: string; username: string },
      isSuperAdmin: boolean
    ) => {
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
    },
    [loadUsers]
  );

  const handleDeleteUser = useCallback(
    (user: StoredUser, currentUserId: number, isSuperAdmin: boolean) => {
      // Prevent deletion of current user
      if (user.id === currentUserId) {
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
    },
    [loadUsers]
  );

  return {
    users,
    loading,
    refreshing,
    onRefresh,
    handlePromoteUser,
    handleDeleteUser,
  };
};
