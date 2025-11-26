import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { userItemStyles } from "../utils/styleHelpers";
import type { StoredUser } from "../db/users";

interface UserCardProps {
  user: StoredUser;
  currentUserId: number;
  isSuperAdmin: boolean;
  onPromote: (user: StoredUser) => void;
  onDelete: (user: StoredUser) => void;
  onViewProfile: (user: StoredUser) => void;
}

const UserCard = React.memo(
  ({
    user,
    currentUserId,
    isSuperAdmin,
    onPromote,
    onDelete,
    onViewProfile,
  }: UserCardProps) => {
    const styles = useMemo(() => userItemStyles(), []);

    const isCurrentUser = user.id === currentUserId;
    const isSuperAdminUser = user.role === "superadmin";

    const getRoleStyle = () => {
      if (user.role === "superadmin") return styles.roleSuperAdmin;
      if (user.role === "admin") return styles.roleAdmin;
      return styles.roleUser;
    };

    return (
      <View style={styles.card}>
        <View style={styles.info}>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.email} numberOfLines={1}>
            {user.email}
          </Text>
          <View style={styles.roleContainer}>
            <Text style={[styles.role, getRoleStyle()]}>
              {user.role.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {/* Promote/Demote Button - Super Admin */}
          {isSuperAdmin && (
            <>
              {user.role === "user" && !isCurrentUser && (
                <TouchableOpacity
                  style={[styles.button, styles.promoteButton]}
                  onPress={() => onPromote(user)}
                >
                  <Text style={styles.buttonText}>Promote</Text>
                </TouchableOpacity>
              )}
              {user.role === "admin" && !isCurrentUser && (
                <TouchableOpacity
                  style={[styles.button, styles.demoteButton]}
                  onPress={() => onPromote(user)}
                >
                  <Text style={styles.buttonText}>Demote</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Promote Button - Regular Admin */}
          {!isSuperAdmin && user.role === "user" && (
            <TouchableOpacity
              style={[styles.button, styles.promoteButton]}
              onPress={() => onPromote(user)}
            >
              <Text style={styles.buttonText}>Promote</Text>
            </TouchableOpacity>
          )}

          {/* Delete Button - Super Admin only */}
          {isSuperAdmin && !isCurrentUser && !isSuperAdminUser && (
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={() => onDelete(user)}
            >
              <Text style={styles.buttonText}>Remove</Text>
            </TouchableOpacity>
          )}

          {/* Profile Button */}
          {!isSuperAdminUser && !isCurrentUser && (
            <TouchableOpacity
              style={[styles.button, styles.viewButton]}
              onPress={() => onViewProfile(user)}
            >
              <Text style={styles.buttonText}>Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
);

UserCard.displayName = "UserCard";

export default UserCard;
