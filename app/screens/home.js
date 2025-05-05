import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import * as Speech from 'expo-speech';
import CameraView from './CameraView';


const HomeScreen = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [activeModel, setActiveModel] = useState(null); // Track active AI model

  // Speech Recognition Event Listeners
  useSpeechRecognitionEvent('start', () => setIsListening(true));
  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    setTimeout(startListening, 500); // Auto-restart listening
  });
  useSpeechRecognitionEvent('result', (event) => {
    const command = event.results[0]?.transcript || '';
    setTranscript(command);
    handleVoiceCommand(command);
  });
  useSpeechRecognitionEvent('error', (event) => {
    console.log("Recognition error:", event.error);
  });

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await ExpoSpeechRecognitionModule.getPermissionsAsync();
    if (status !== 'granted') {
      requestPermissions();
    } else {
      startListening();
    }
  };

  const requestPermissions = async () => {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      Alert.alert('Permission required', 'Microphone access needed for voice commands');
    } else {
      startListening();
    }
  };

  const startListening = async () => {
    try {
      await ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        continuous: true,
        interimResults: false,
        requiresOnDeviceRecognition: false,
        contextualStrings: ['one', 'two', 'three', 'four']
      });
      Speech.speak('Ready for commands');
    } catch (error) {
      console.log('Start listening error:', error);
    }
  };

  const handleVoiceCommand = (command: string) => {
    const normalized = command.toLowerCase().trim();
    const commands: { [key: string]: any } = {
      '1': 1, 'one': 1,
      '2': 2, 'two': 2,
      '3': 3, 'three': 3,
      '4': 4, 'four': 4,
     'close': 'close',
     'ek':1 , "do":2,
     'teen':3, 'char':4
    };

    const buttonNumber = commands[normalized];
    if (buttonNumber) {
      console.log(`Button ${buttonNumber} triggered`);
      Speech.speak(`Button ${buttonNumber} activated`);
      if (buttonNumber ==="close"){
          setActiveModel(null)
      }else{
           setActiveModel(buttonNumber); // Activate the corresponding AI model
      }
    } else if (normalized) {
      Speech.speak('Try numbers one to four');
    }
  };

  const handleButtonPress = (buttonNumber) => {
    console.log(`Button ${buttonNumber} pressed`);
    Speech.speak(`Button ${buttonNumber} activated`);
    setActiveModel(buttonNumber); // Activate the corresponding AI model
  };

  const renderButton = (position, number) => (
    <TouchableOpacity
      style={[styles.button, styles[position]]}
      onPress={() => handleButtonPress(number)}
      accessibilityLabel={`Button ${number}`}
    >
      <Text style={styles.buttonText}>{number}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        {isListening ? 'Listening...' : 'Not listening'}
      </Text>

      <ScrollView style={styles.transcriptContainer}>
        <Text style={styles.transcriptText}>{transcript}</Text>
      </ScrollView>

      {/* Render Camera View if a model is active */}
      {activeModel && (
        <CameraView modelId={activeModel} onClose={() => setActiveModel(null)} />
      )}

      {/* Render buttons */}
      {renderButton('top-left', 1)}
      {renderButton('top-right', 2)}
      {renderButton('bottom-left', 3)}
      {renderButton('bottom-right', 4)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  status: {
    fontSize: 20,
    marginBottom: 10,
    color: '#333',
  },
  transcriptContainer: {
    height: 100,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 150,
  },
  transcriptText: {
    fontSize: 16,
    color: '#666',
  },
  button: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  'top-left': { top: 40, left: 40 },
  'top-right': { top: 40, right: 40 },
  'bottom-left': { bottom: 40, left: 40 },
  'bottom-right': { bottom: 40, right: 40 },
});

export default HomeScreen;