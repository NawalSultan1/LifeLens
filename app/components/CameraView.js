import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Speech from "expo-speech";
import {
  useSpeechRecognitionEvent,
  ExpoSpeechRecognitionModule,
} from "expo-speech-recognition";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const CAMERA_MODES = {
  1: "Currency Detection",
  2: "Object Detection",
  3: "Text Detection",
  4: "Hurdle Detection",
};

export default function CameraViewComponent({ route, navigation }) {
  const { mode } = route.params;
  const [permission, requestPermission] = useCameraPermissions();

  const [lastSpokenTime, setLastSpokenTime] = useState(0);
  const cameraRef = useRef(null);

  // Announce camera mode
  useEffect(() => {
    const modeName = CAMERA_MODES[mode];
    Speech.speak(`Opening ${modeName}`);
    setTimeout(() => {
      Speech.speak("Model loading...");
    }, 1000);
    setTimeout(() => {
      Speech.speak("Model loaded successfully");
    }, 2000);
  }, [mode]);

  // Listen for "close" command
  useSpeechRecognitionEvent("result", ({ results }) => {
    const cmd = results[0]?.transcript?.toLowerCase().trim() || "";
    if (cmd.includes("close")) {
      Speech.speak("Closing camera view");
      navigation.goBack();
    }
  });

  // Keep listening after stop
  useSpeechRecognitionEvent("end", () => {
    setTimeout(() => ExpoSpeechRecognitionModule.start(), 500);
  });

  // Render UI
  if (!permission) return null;
  if (!permission.granted)
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera permission is required</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />

      {/* Mode Label Overlay */}
      <View style={styles.statusOverlay}>
        <Text style={styles.modeText}>{CAMERA_MODES[mode]}</Text>
      </View>

      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => {
          Speech.speak("Closing camera");
          navigation.goBack();
        }}
        accessibilityLabel="Close camera"
        accessibilityRole="button"
      >
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  statusOverlay: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  modeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00ff00",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  closeBtn: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#dc3545",
    padding: 15,
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    color: "#fff",
  },
  permissionButton: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 5,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
