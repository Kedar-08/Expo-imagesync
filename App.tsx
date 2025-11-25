import React, { useState } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import CaptureScreen from "./src/screens/CaptureScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import UserManagementScreen from "./src/screens/UserManagementScreen";
import AssetManagementScreen from "./src/screens/AssetManagementScreen";
import QueueStatusBar from "./src/components/QueueStatusBar";

type AppScreen = "capture" | "users" | "assets";

function AppContent() {
  const { isSignedIn, isLoading, user } = useAuth();
  const [authScreen, setAuthScreen] = useState<"login" | "signup">("login");
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("capture");

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        {authScreen === "login" ? (
          <LoginScreen onSignupPress={() => setAuthScreen("signup")} />
        ) : (
          <SignupScreen onLoginPress={() => setAuthScreen("login")} />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <QueueStatusBar />
      {currentScreen === "capture" && (
        <CaptureScreen
          onNavigateToUsers={() => setCurrentScreen("users")}
          onNavigateToAssets={() => setCurrentScreen("assets")}
          currentScreen={currentScreen}
        />
      )}
      {currentScreen === "users" && user && (
        <UserManagementScreen
          onBack={() => setCurrentScreen("capture")}
          onNavigateToAssets={() => setCurrentScreen("assets")}
          currentUser={user}
          isSuperAdmin={user.role === "superadmin"}
          currentScreen={currentScreen}
        />
      )}
      {currentScreen === "assets" && (
        <AssetManagementScreen
          onBack={() => setCurrentScreen("capture")}
          onNavigateToUsers={() => setCurrentScreen("users")}
          currentScreen={currentScreen}
          currentUser={user}
        />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
});
