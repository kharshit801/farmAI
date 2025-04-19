import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkLanguage = async () => {
      try {
        const language = await AsyncStorage.getItem('language');
        console.log('Stored language:', language); // Debug log
        if (language) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding' as any);
        }
      } catch (error) {
        console.error('Error checking language:', error);
        router.replace('/onboarding' as any);
      } finally {
        setIsLoading(false);
      }
    };

    checkLanguage();
  }, [router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#3563EB" />
      </View>
    );
  }

  return null; // Render nothing since redirection happens
}