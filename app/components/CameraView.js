import React, { useRef, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
} from "react-native";
import { CameraView as Camera, useCameraPermissions } from "expo-camera";
import { FastTFLite, loadTensorflowModel } from "react-native-fast-tflite";
import * as Speech from "expo-speech";
import * as ImageManipulator from "expo-image-manipulator"; // Correct import
import * as FileSystem from "expo-file-system";
import { decode } from "jpeg-js";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// Pakistani currency denominations
const CURRENCY_CLASSES = {
  0: "10 Rupees",
  1: "20 Rupees",
  2: "50 Rupees",
  3: "100 Rupees",
  4: "500 Rupees",
  5: "1000 Rupees",
  6: "5000 Rupees",
  // Add other object classes if your model detects them
  7: "Object",
};

const CameraViewComponent = ({ onClose }) => {
  const cameraRef = useRef(null);
  const [model, setModel] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [detections, setDetections] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [lastSpokenTime, setLastSpokenTime] = useState(0);

  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log("Loading model...");
        const m = await loadTensorflowModel(
          require("../../assets/models/my_model_float16.tflite")
        );
        console.log("Model loaded successfully");
        setModel(m);
      } catch (error) {
        console.error("Error loading model:", error);
        Speech.speak("Failed to load detection model");
      }
    };

    loadModel();

    return () => {
      // Cleanup
      if (model) {
        // Any model cleanup if needed
      }
    };
  }, []);

  useEffect(() => {
    let intervalId;

    if (model && permission?.granted) {
      intervalId = setInterval(captureAndDetect, 2000); // Process every 2 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [model, permission, processing]);

  const imageToTensor = async (uri) => {
    // Read the image file
    const imgB64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const imgBuffer = Buffer.from(imgB64, "base64");
    const rawImageData = decode(imgBuffer);

    // Get dimensions
    const { width, height } = rawImageData;

    // Create a Float32Array to hold the processed image data
    const tensor = new Float32Array(480 * 640 * 3);

    // Resize and normalize the image data
    const stride = width * 4;
    const targetStride = 640 * 3;

    for (let y = 0; y < 480; y++) {
      const sourceY = Math.floor((y * height) / 480);
      for (let x = 0; x < 640; x++) {
        const sourceX = Math.floor((x * width) / 640);
        const sourceIdx = sourceY * stride + sourceX * 4;
        const targetIdx = y * targetStride + x * 3;

        // Normalize to [0, 1] range
        tensor[targetIdx] = rawImageData.data[sourceIdx] / 255.0;
        tensor[targetIdx + 1] = rawImageData.data[sourceIdx + 1] / 255.0;
        tensor[targetIdx + 2] = rawImageData.data[sourceIdx + 2] / 255.0;
      }
    }

    return tensor;
  };

  const captureAndDetect = async () => {
    if (!cameraRef.current || !model || processing) return;

    try {
      setProcessing(true);

      // Take picture
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });

      // Resize the image to match model input dimensions (480x640)
      // Correct usage of ImageManipulator
      const resizedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 640, height: 480 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Convert image to tensor
      const tensor = await imageToTensor(resizedImage.uri);

      // Prepare input for the model
      const input = {
        type: "float32",
        shape: [1, 480, 640, 3],
        data: tensor,
      };

      // Run inference
      console.log("Running model inference...");
      const outputs = await model.runModel(input);

      // Parse the output based on your model's format
      const detectedObjects = parseModelOutput(outputs);

      setDetections(detectedObjects);

      // Speak out the results
      announceResults(detectedObjects);
    } catch (error) {
      console.error("Detection error:", error);
    } finally {
      setProcessing(false);
    }
  };

  const parseModelOutput = (modelOutput) => {
    // This function needs to be adjusted based on your specific model output format
    // For YOLOv5/v8 style output with shape [1, 84, 6300]

    const output = modelOutput[0]; // Get the first output tensor
    const results = [];

    // Assuming the output format is [batch, num_classes + 5, num_anchors]
    // Where the 5 values are: x, y, width, height, confidence
    const numClasses = output.shape[1] - 5;
    const numDetections = output.shape[2];

    const confidenceThreshold = 0.5;

    for (let i = 0; i < numDetections; i++) {
      const confidence = output.data[4 * numDetections + i];

      if (confidence >= confidenceThreshold) {
        // Find the class with highest probability
        let maxClassProb = 0;
        let classId = 0;

        for (let c = 0; c < numClasses; c++) {
          const classProb = output.data[(5 + c) * numDetections + i];
          if (classProb > maxClassProb) {
            maxClassProb = classProb;
            classId = c;
          }
        }

        // Get bounding box coordinates
        const x = output.data[0 * numDetections + i];
        const y = output.data[1 * numDetections + i];
        const w = output.data[2 * numDetections + i];
        const h = output.data[3 * numDetections + i];

        // Convert normalized coordinates to screen coordinates
        results.push({
          x: (x - w / 2) * SCREEN_W,
          y: (y - h / 2) * SCREEN_H,
          width: w * SCREEN_W,
          height: h * SCREEN_H,
          confidence: confidence,
          classId: classId,
          label: CURRENCY_CLASSES[classId] || `Class ${classId}`,
          isCurrency: classId < 7, // Adjust based on your class mapping
        });
      }
    }

    return results;
  };

  const announceResults = (detections) => {
    const now = Date.now();
    // Prevent speaking too frequently (at least 2.5 seconds between announcements)
    if (now - lastSpokenTime < 2500) return;

    if (detections.length === 0) {
      // Occasionally mention no detections
      if (now - lastSpokenTime > 5000) {
        Speech.speak("No currency detected");
        setLastSpokenTime(now);
      }
      return;
    }

    // Sort by confidence (highest first)
    const sortedDetections = [...detections].sort(
      (a, b) => b.confidence - a.confidence
    );

    // Prioritize currency announcements
    const currencies = sortedDetections.filter((d) => d.isCurrency);

    if (currencies.length > 0) {
      // Announce the most confident currency
      const topCurrency = currencies[0];
      Speech.speak(
        `Detected ${topCurrency.label} with ${Math.round(
          topCurrency.confidence * 100
        )}% confidence`
      );
    } else {
      // Just announce object detection if no currency
      Speech.speak("Object detected");
    }

    setLastSpokenTime(now);
  };

  if (!permission) return <View />;

  if (!permission.granted)
    return (
      <View style={styles.container}>
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
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type="back"
        autoFocus={true}
      />

      {/* Render detection boxes */}
      {detections.map((detection, index) => (
        <View
          key={index}
          style={[
            styles.box,
            {
              left: detection.x,
              top: detection.y,
              width: detection.width,
              height: detection.height,
              borderColor: detection.isCurrency ? "#00ff00" : "#ff0000",
            },
          ]}
        >
          <Text style={styles.label}>
            {detection.label} ({Math.round(detection.confidence * 100)}%)
          </Text>
        </View>
      ))}

      <TouchableOpacity
        style={styles.closeBtn}
        onPress={onClose}
        accessibilityLabel="Close camera"
      >
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

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
    borderWidth: 3,
    borderColor: "red",
  },
  label: {
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 4,
    fontSize: 14,
    fontWeight: "bold",
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
    fontSize: 18,
    fontWeight: "bold",
  },
  permissionText: {
    fontSize: 18,
    textAlign: "center",
    margin: 20,
  },
  permissionButton: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 5,
    margin: 20,
  },
  permissionButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CameraViewComponent;
