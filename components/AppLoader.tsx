// components/AppLoader.tsx
import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Asset } from 'expo-asset';
import {ThemedText} from './ThemedText';

// Prevent the splash screen from automatically hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

type AppLoaderProps = {
  children: React.ReactNode;
  fontsToLoad?: Record<string, any>;
  imagesToLoad?: Array<string | number>;
};

export default function AppLoader({ 
  children, 
  fontsToLoad = {}, 
  imagesToLoad = [] 
}: AppLoaderProps) {
  const [appIsReady, setAppIsReady] = React.useState(false);

  // Load any fonts and images needed
  useEffect(() => {
    async function prepare() {
      try {
        // Load fonts
        if (Object.keys(fontsToLoad).length > 0) {
          await Font.loadAsync(fontsToLoad);
        }

        // Load images
        if (imagesToLoad.length > 0) {
          const imageAssets = imagesToLoad.map((image) => {
            if (typeof image === 'string') {
              return Image.prefetch(image);
            } else {
              return Asset.fromModule(image).downloadAsync();
            }
          });
          await Promise.all(imageAssets);
        }

        // Add artificial delay for a smoother user experience
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, [fontsToLoad, imagesToLoad]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6A994E" />
        <ThemedText style={styles.text}>Loading FarmAI...</ThemedText>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 10,
    fontSize: 16,
  },
});