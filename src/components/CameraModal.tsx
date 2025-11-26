import React, { useRef, useCallback } from "react";
import { Modal, View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Camera, CameraType } from "expo-camera";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCapture: (cameraRef: Camera) => Promise<void>;
}

export default function CameraModal({ visible, onClose, onCapture }: Props) {
  const cameraRef = useRef<Camera | null>(null);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      await onCapture(cameraRef.current);
      onClose();
    } catch (error) {
      console.warn("Camera capture error:", error);
    }
  }, [onCapture, onClose]);

  return (
    <Modal visible={visible} animationType="slide">
      <Camera
        style={StyleSheet.absoluteFill}
        type={CameraType.back}
        ref={(ref: any) => {
          cameraRef.current = ref;
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCapture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Camera>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
    paddingBottom: 40,
  },
  controls: {
    alignItems: "center",
    gap: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
  },
  cancelButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
