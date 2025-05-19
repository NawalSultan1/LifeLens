// components/CameraViewComponent.js
import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Alert,
} from "react-native";

import { CameraView } from "expo-camera";
import {
  useObjectDetectionModel,
  ObjectDetectionModel,
} from "@infinitered/react-native-mlkit-object-detection";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export default function CameraViewComponent({ onClose }) {
  const cameraRef = useRef(null);
  const [objects, setObjects] = useState([]);
  const [hasPermission, setHasPermission] = useState(null);

  // Load the model
  const { model, loading, error } = useObjectDetectionModel({
    modelName: "default", // or 'autoML' if you're using custom models
  });

  useEffect(() => {
    (async () => {
      const { status } = await CameraView.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  if (error) {
    Alert.alert("Model Error", error.message);
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text>Camera permission is required</Text>
      </View>
    );
  }

  const handleProcessFrame = async ({ nativeEvent }) => {
    if (!model || !nativeEvent?.base64Image) return;

    try {
      const result = await model.process(nativeEvent.base64Image);
      console.log("Detected objects:", result);

      if (result.length > 0) {
        const labels = result.map((obj) => obj.label).join(", ");
        setObjects(result);
      } else {
        setObjects([]);
      }
    } catch (err) {
      console.error("Error processing frame:", err);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onCameraReady={() => console.log("Camera ready")}
        onFrameProcessed={handleProcessFrame}
        enableTorch={false}
        mode="picture"
        imageType="jpg"
        quality="high"
        accessibilityLabel="Live camera view"
      />

      {/* Render bounding boxes */}
      {objects.map((obj, index) => (
        <View
          key={index}
          style={[
            styles.box,
            {
              left: obj.frame.origin.x * SCREEN_W,
              top: obj.frame.origin.y * SCREEN_H,
              width: obj.frame.size.width * SCREEN_W,
              height: obj.frame.size.height * SCREEN_H,
            },
          ]}
        >
          <Text style={styles.label}>{obj.label}</Text>
        </View>
      ))}

      {/* Close Button */}
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    width: SCREEN_W,
    height: SCREEN_H,
    zIndex: 1,
  },
  camera: {
    flex: 1,
  },
  box: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "red",
    backgroundColor: "rgba(255, 0, 0, 0.2)",
  },
  label: {
    color: "red",
    backgroundColor: "#fff",
    fontSize: 12,
    padding: 2,
  },
  closeBtn: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#dc3545",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  closeText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
