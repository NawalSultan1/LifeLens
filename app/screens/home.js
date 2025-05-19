import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";

import * as Speech from "expo-speech";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

const HomeScreen = ({ navigation }) => {
  const [isListening, setIsListening] = useState(false);

  // Available modes
  const MODES = {
    1: { name: "Currency Detection", key: "currency" },
    2: { name: "Object Detection", key: "object" },
    3: { name: "Text Detection", key: "text" },
    4: { name: "Hurdle Detection", key: "hurdle" },
  };

  // Handle voice commands
  useSpeechRecognitionEvent("result", ({ results }) => {
    const text = results[0]?.transcript?.toLowerCase().trim() || "";
    handleVoiceCommand(text);
  });

  useSpeechRecognitionEvent("start", () => setIsListening(true));
  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
    setTimeout(startListening, 500);
  });

  const startListening = async () => {
    try {
      await ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        continuous: true,
        interimResults: false,
        contextualStrings: ["1", "2", "3", "4", "ek", "do", "teen", "char"],
      });
      speakIntro();
    } catch (e) {
      console.log("Error starting speech recognition:", e);
    }
  };

  const checkPermissions = async () => {
    const { status } = await ExpoSpeechRecognitionModule.getPermissionsAsync();
    if (status !== "granted") {
      const res = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!res.granted) {
        Alert.alert(
          "Permission Required",
          "Microphone access needed for voice commands"
        );
        return;
      }
    }
    startListening();
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const speakIntro = () => {
    const instructions = `
      Say one for currency detection.
      Say two for object detection.
      Say three for text detection.
      Say four for hurdle detection.
    `;
    Speech.speak(instructions);
  };

  const handleVoiceCommand = (cmd) => {
    const map = {
      1: 1,
      one: 1,
      ek: 1,
      2: 2,
      two: 2,
      do: 2,
      3: 3,
      three: 3,
      teen: 3,
      4: 4,
      four: 4,
      char: 4,
    };
    const val = map[cmd];
    if (val) {
      let label = "";
      switch (val) {
        case 1:
          label = "Currency";
          break;
        case 2:
          label = "Object";
          break;
        case 3:
          label = "Text";
          break;
        case 4:
          label = "Hurdle";
          break;
      }
      Speech.speak(`Opening ${label} detection`);
      navigation.navigate("Camera", { mode: val });
    } else if (cmd) {
      Speech.speak("Please say one, two, three, or four.");
    }
  };

  const renderButton = (pos, num, label) => (
    <TouchableOpacity
      key={num}
      style={[styles.button, styles[pos]]}
      onPress={() => {
        Speech.speak(`Opening ${label}`);
        navigation.navigate("Camera", { mode: num });
      }}
      accessibilityLabel={`Button ${num}: ${label}`}
      accessibilityRole="button"
    >
      <Text style={styles.buttonText}>{num}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* <Text style={styles.title}>LifeLens</Text> */}
      <Text style={styles.subtitle}>
        {isListening ? "Listening for commands..." : "Say 1, 2, 3, or 4"}
      </Text>

      {renderButton("topLeft", 1, "Currency Detection")}
      {renderButton("topRight", 2, "Object Detection")}
      {renderButton("bottomLeft", 3, "Text Detection")}
      {renderButton("bottomRight", 4, "Hurdle Detection")}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    color: "#555",
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  button: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  topLeft: { top: 20, left: 20 },
  topRight: { top: 20, right: 20 },
  bottomLeft: { bottom: 20, left: 20 },
  bottomRight: { bottom: 20, right: 20 },
});

export default HomeScreen;
