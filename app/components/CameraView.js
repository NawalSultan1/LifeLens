import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { CameraView as Camera, useCameraPermissions } from 'expo-camera';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import * as Speech from 'expo-speech';
import * as ImageManipulator from 'expo-image-manipulator';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const CameraViewComponent = ({ onClose }) => {
  const cameraRef = useRef(null);
  const [model, setModel] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [detections, setDetections] = useState([]);

  useEffect(() => {
    (async()=>{
      const m = await loadTensorflowModel(require('../../assets/models/my_model_float16.tflite'));
      setModel(m);
    })();
  },[]);

  useEffect(() => {
    let intv;
    if (model && permission?.granted) {
      intv = setInterval(captureAndDetect, 3000);
    }
    return ()=> clearInterval(intv);
  }, [model, permission]);

  const captureAndDetect = async () => {
    if (!cameraRef.current || !model) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64:false });
      console.log(photo.uri)
      const resized = ImageManipulator.ImageManipulator.manipulate(photo.uri);

      const input = { type:'uint8', shape:[1,224,224,3], data:resized.base64 };
      const out = model.runModel(input);
      const dets = parseOutput(out);
      setDetections(dets);
      if (dets.length) Speech.speak('Detected '+ dets.map(d=>d.label).join(', '));
    } catch(e) { console.error(e); }
  };

  const parseOutput = (out) => {
    // Adjust according to your model
    const boxes = out[0];
    const classes = out[1];
    const scores = out[2];
    const n = out[3][0];
    const results = [];
    for (let i=0;i<n;i++){
      if (scores[i]>0.5){
        const [ymin,xmin,ymax,xmax] = boxes[i];
        results.push({
          x: xmin*SCREEN_W,
          y: ymin*SCREEN_H,
          width: (xmax-xmin)*SCREEN_W,
          height:(ymax-ymin)*SCREEN_H,
          label: `Class ${classes[i]}`
        });
      }
    }
    return results;
  };

  if (!permission) return <View />;
  if (!permission.granted) return (
    <View style={styles.container}>
      <Text>Please grant camera permission.</Text>
      <TouchableOpacity onPress={requestPermission}><Text>Grant</Text></TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Camera ref={cameraRef} style={styles.camera} type={"back"} />
      {detections.map((d,i)=>(
        <View key={i} style={[styles.box,{ left:d.x, top:d.y, width:d.width, height:d.height }] }>
          <Text style={styles.label}>{d.label}</Text>
        </View>
      ))}
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container:{ flex:1, position:'absolute', top:0,left:0,width:SCREEN_W,height:SCREEN_H, zIndex:1 },
  camera:{ flex:1 },
  box:{ position:'absolute', borderWidth:2, borderColor:'red' },
  label:{ color:'red', backgroundColor:'#fff' },
  closeBtn:{ position:'absolute', bottom:30, right:30, backgroundColor:'#dc3545', padding:10, borderRadius:5 },
  closeText:{ color:'#fff' }
});

export default CameraViewComponent;