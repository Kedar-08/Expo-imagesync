import React from "react";
import { View, StyleSheet, SafeAreaView, StatusBar } from "react-native";
import CaptureScreen from "./src/screens/CaptureScreen";
import QueueStatusBar from "./src/components/QueueStatusBar";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <QueueStatusBar />
      <CaptureScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});
