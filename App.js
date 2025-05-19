import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./app/screens/home";
import CameraViewComponent from "./app/components/CameraView";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "LifeLens", headerShown: false }}
        />
        <Stack.Screen
          name="Camera"
          component={CameraViewComponent}
          options={{ title: "Detection Mode" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
