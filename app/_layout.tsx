import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import AnimatedSplashScreen from '@/components/AnimatedSplashScreen';
import * as Location from 'expo-location';
import { createContext } from 'react';
import { Alert } from 'react-native';
import { DiagnosisProvider } from '@/context/DiagnosisContext';
import { FieldProvider } from './../context/fieldcontext'

// Create a context to share location data across screens
export const LocationContext = createContext<{
  location: { latitude: number; longitude: number } | null;
  errorMsg: string | null;
  requestLocationPermission: () => Promise<void>;
}>({
  location: null,
  errorMsg: null,
  requestLocationPermission: async () => {},
});

// Prevent the splash screen from automatically hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [loaded, error] = useFonts({
    'SpaceMono-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
    // Add any other fonts you want to use here
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Function to request location permissions and get user location
  const requestLocationPermission = async () => {
    try {
      // Request permission to access location
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to use all features of this app.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get the current position
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Set the location state
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        
      });
    } catch (err) {
      setErrorMsg('Error getting location');
      console.error('Error getting location:', err);
    }
  };

  // Request location when app starts
  useEffect(() => {
    requestLocationPermission();
    
    

  }, []); 

  
  console.log('Error Message:', errorMsg);

  if (!loaded) {
    return null;
  }

  return (
<FieldProvider>
    <DiagnosisProvider>
      
    <LocationContext.Provider value={{ location, errorMsg, requestLocationPermission }}>
      <AnimatedSplashScreen image={require('../assets/images/logoPlanta.png')}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </AnimatedSplashScreen>
    </LocationContext.Provider>
    
    </DiagnosisProvider>
    </FieldProvider>
  );
}