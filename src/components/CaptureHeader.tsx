import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { buttonStyle, buttonTextStyle } from "../utils/styleHelpers";
import type { AuthUser } from "../types";

interface Props {
  user: AuthUser | null;
  isUser: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  currentScreen?: "capture" | "users" | "assets";
  onLogout: () => Promise<void>;
  onNavigateToUsers?: () => void;
  onNavigateToAssets?: () => void;
  onCapture: () => Promise<void>;
  onPick: () => Promise<void>;
}

export default function CaptureHeader({
  user,
  isUser,
  isAdmin,
  isSuperAdmin,
  currentScreen,
  onLogout,
  onNavigateToUsers,
  onNavigateToAssets,
  onCapture,
  onPick,
}: Props) {
  const handleLogout = useCallback(async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", onPress: () => {}, style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await onLogout();
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout");
          }
        },
        style: "destructive",
      },
    ]);
  }, [onLogout]);

  return (
    <View>
      {/* Header with user info and logout */}
      <View style={styles.headerContainer}>
        <View style={styles.userInfoContainer}>
          <Text style={styles.userGreeting}>👤 {user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.userRole}>Site Auditor</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons - Simplified for POC */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            buttonStyle("#007AFF", 30, 12),
            { minWidth: 140, alignItems: "center" },
          ]}
          onPress={onCapture}
        >
          <Text style={buttonTextStyle()}>📷 Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            buttonStyle("#007AFF", 30, 12),
            { minWidth: 140, alignItems: "center" },
          ]}
          onPress={onPick}
        >
          <Text style={buttonTextStyle()}>🖼️ Gallery</Text>
        </TouchableOpacity>
      </View>

      {/* Admin features removed for POC */}
      {false && (
        <View>
          <View style={styles.adminButtonRow}>
            <Text style={styles.adminModeText}>
              📊 Admin Mode - View & Manage
            </Text>
          </View>
          <View style={styles.adminMenuRow}>
            <TouchableOpacity
              style={[
                styles.adminButton,
                currentScreen === "users" && styles.adminButtonActive,
              ]}
              onPress={onNavigateToUsers}
            >
              <Text
                style={[
                  styles.adminButtonText,
                  currentScreen === "users" && styles.adminButtonTextActive,
                ]}
              >
                👥 Users
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.adminButton,
                currentScreen === "assets" && styles.adminButtonActive,
              ]}
              onPress={onNavigateToAssets}
            >
              <Text
                style={[
                  styles.adminButtonText,
                  currentScreen === "assets" && styles.adminButtonTextActive,
                ]}
              >
                🖼️ Assets
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  userInfoContainer: {
    flex: 1,
  },
  userGreeting: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    fontWeight: "500",
    color: "#007AFF",
  },
  logoutButton: {
    backgroundColor: "#ff3b30",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 12,
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: "#fff",
  },
  adminButtonRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  adminModeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },
  adminMenuRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
    backgroundColor: "#fff",
  },
  adminButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d0d0d0",
  },
  adminButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#0051d5",
  },
  adminButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  adminButtonTextActive: {
    color: "#fff",
  },
});
