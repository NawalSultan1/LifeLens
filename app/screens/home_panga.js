// app/screens/CameraView.js
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import { Asset } from 'expo-asset';
// import { Camera } from 'expo-camera';
import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

// Screen dimensions for scaling boxes
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Placeholder preprocess: implement JPEG→Float32 normalization
function preprocess(jpegData, imgW, imgH) {
  // TODO: decode JPEG, resize to model input size, normalize [0,1] or [-1,1]
  // Return Float32Array of shape [1 * 3 * inputH * inputW]
}

// Placeholder postprocess: convert raw output tensor to boxes
function postprocess(outputTensor) {
  // TODO: apply YOLO decoding (anchors, NMS) to outputTensor.data
  // Return array [ { x, y, w, h, label, confidence }, … ]
}

const CameraViewScreen = ({ modelId, onClose }) => {
  const devices = useCameraDevices();
  const device = devices.back;
  const [session, setSession] = useState(null);
  const [boxes, setBoxes] = useState([]);

  // 1) Load the ONNX model session once
  useEffect(() => {
    (async () => {
      const asset = Asset.fromModule(require('../screens/my_model.onnx'));
      await asset.downloadAsync();
      const sess = await InferenceSession.create(asset.uri);
      setSession(sess);
    })();
  }, []);


  // 2) Frame processor to grab JPEG bytes
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const jpegData = frame.toJPEG(); // Vision Camera API
    runOnJS(processFrame)(jpegData, frame.width, frame.height);
  }, [session]);

  // 3) Run inference on JS thread
  const processFrame = async (jpegData, imgW, imgH) => {
    if (!session) return;
    const data = preprocess(jpegData, imgW, imgH);
    const tensor = new Tensor('float32', data, [1, 3, imgH, imgW]);
    const outputMap = await session.run({ input: tensor });
    const raw = outputMap[Object.keys(outputMap)[0]];
    const newBoxes = postprocess(raw);
    setBoxes(newBoxes);
  };

  if (!device) return <View style={styles.cameraContainer} />;
  
  return (
    <View style={styles.cameraContainer}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        frameProcessorFps={5}
      />
      <Svg style={StyleSheet.absoluteFill}>
        {boxes.map((b, i) => (
          <React.Fragment key={i}>
            <Rect
              x={b.x * SCREEN_W}
              y={b.y * SCREEN_H}
              width={b.w * SCREEN_W}
              height={b.h * SCREEN_H}
              stroke="red"
              strokeWidth={2}
            />
            <SvgText
              x={b.x * SCREEN_W}
              y={b.y * SCREEN_H - 5}
              fontSize="12"
              fill="red"
            >
              {`${b.label} ${(b.confidence*100).toFixed(0)}%`}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    width: '100%',
    height: '60%',
    position: 'absolute',
    top: 130,
    left: 20,
    zIndex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    zIndex: 2,
  },
  closeButtonText: { color: '#000' },
});

export default CameraViewScreen;
