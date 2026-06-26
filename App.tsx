import "./global.css";
import { registerRootComponent } from "expo";
import React, { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { LoginScreen } from "./src/screens/LoginScreen";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  return (
    <SafeAreaProvider>
      {isAuthenticated ? (
        <DashboardScreen onSignOut={() => setIsAuthenticated(false)} />
      ) : (
        <LoginScreen onSignInSuccess={() => setIsAuthenticated(true)} />
      )}
    </SafeAreaProvider>
  );
}

// Registers the root component of the Expo project
registerRootComponent(App);
