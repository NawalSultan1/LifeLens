// HomeScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import * as Speech from "expo-speech";
import CameraViewComponent from "../components/CameraView";

const HomeScreen = () => {
  const [isListening, setIsListening] = useState(false);
  const [activeModel, setActiveModel] = useState(null);

  // Speech event handlers
  useSpeechRecognitionEvent("start", () => setIsListening(true));
  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
    setTimeout(startListening, 500);
  });
  useSpeechRecognitionEvent("result", ({ results }) => {
    const text = results[0]?.transcript.toLowerCase().trim();
    handleVoiceCommand(text);
  });
  useSpeechRecognitionEvent("error", (e) =>
    console.log("Recognition error:", e.error)
  );

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await ExpoSpeechRecognitionModule.getPermissionsAsync();
    if (status !== "granted") {
      const res = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!res.granted) {
        Alert.alert(
          "Permission required",
          "Microphone access needed for voice commands"
        );
        return;
      }
    }
    startListening();
  };

  const startListening = async () => {
    try {
      await ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        continuous: true,
        interimResults: false,
        requiresOnDeviceRecognition: false,
        contextualStrings: ["one", "two", "three", "four"],
      });
      Speech.speak("Ready for commands");
    } catch (e) {
      console.log("Start listening error:", e);
    }
  };

  const handleVoiceCommand = (cmd) => {
    const map = {
      1: 1,
      one: 1,
      2: 2,
      two: 2,
      3: 3,
      three: 3,
      4: 4,
      four: 4,
      close: "close",
    };
    const val = map[cmd];
    if (val) {
      if (val === "close") setActiveModel(null);
      else setActiveModel(val);
      Speech.speak(val === "close" ? "Closing camera" : "Opening camera");
    } else if (cmd) {
      Speech.speak("Please say one, two, three, or four.");
    }
  };

  const handleButtonPress = (n) => {
    setActiveModel(n);
    Speech.speak(`Opening camera ${n}`);
  };

  const renderButton = (pos, num) => (
    <TouchableOpacity
      style={[styles.button, styles[pos]]}
      onPress={() => handleButtonPress(num)}
      accessibilityLabel={`Button ${num}`}
    >
      <Text style={styles.buttonText}>{num}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        {isListening ? "Listening..." : "Not listening"}
      </Text>
      {activeModel && (
        <CameraViewComponent onClose={() => setActiveModel(null)} />
      )}
      {renderButton("topLeft", 1)}
      {renderButton("topRight", 2)}
      {renderButton("bottomLeft", 3)}
      {renderButton("bottomRight", 4)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  status: { fontSize: 18, margin: 10 },
  button: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007bff",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  topLeft: { top: 40, left: 40 },
  topRight: { top: 40, right: 40 },
  bottomLeft: { bottom: 40, left: 40 },
  bottomRight: { bottom: 40, right: 40 },
});

export default HomeScreen;
