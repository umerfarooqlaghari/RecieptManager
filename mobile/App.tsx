import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from './src/providers/AuthProvider';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';

// Deep link listener integration
import * as Linking from 'expo-linking';

function Route() {
  const { session, isLoading } = useAuth();

  // Listen for deep links from OAuth
  Linking.useURL();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return session && session.user ? <HomeScreen /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <Route />
    </AuthProvider>
  );
}
