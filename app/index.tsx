import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function IndexScreen() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function checkExistingSession() {
      try {
        const rawUser = await AsyncStorage.getItem('loggedInUser');
        if (rawUser) {
          // ✅ Safe Session Found: Send them straight to the working dashboard tabs workspace
          router.replace('/(tabs)');
        } else {
          // 🚪 No Session: Front Door layout defaults cleanly to Sign-In first!
          router.replace('/sign-in');
        }
      } catch (err) {
        console.error('Boot authorization check failed:', err);
        router.replace('/sign-in'); // Safe fallback
      } finally {
        setCheckingSession(false);
      }
    }
    checkExistingSession();
  }, []);

  // Soft fallback layout grid matches application background colors to keep startup smooth
  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}