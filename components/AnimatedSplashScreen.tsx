// components/AnimatedSplashScreen.tsx
import React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, View, Image, Dimensions, ImageSourcePropType } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Define the props interface
interface AnimatedSplashScreenProps {
  children: React.ReactNode;
  image: ImageSourcePropType;
}

export default function AnimatedSplashScreen({ children, image }: AnimatedSplashScreenProps) {
  const [isAppReady, setAppReady] = useState(false);
  const [isSplashAnimationComplete, setAnimationComplete] = useState(false);
  
  // Animation values
  const animation = useMemo(() => new Animated.Value(1), []);
  const scaleAnimation = useMemo(() => new Animated.Value(1), []);
  
  // Prepare app resources and data
  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make API calls, etc.
        // Artificially delay for a smooth splash transition
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppReady(true);
      }
    }

    prepare();
  }, []);

  // Callback when the app is ready
  const onImageLoaded = useCallback(async () => {
    try {
      await SplashScreen.hideAsync();
      // Start animations once the splash screen is hidden
      Animated.parallel([
        Animated.timing(animation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimation, {
          toValue: 1.5,
          friction: 4,
          useNativeDriver: true,
        })
      ]).start(() => {
        setAnimationComplete(true);
      });
    } catch (e) {
      console.warn(e);
    }
  }, [animation]);

  if (!isAppReady || !isSplashAnimationComplete) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <Animated.View 
          style={[
            StyleSheet.absoluteFill, 
            { 
              backgroundColor: '#1f1f1f', // Green color for plant app
              opacity: animation,
            }
          ]}
        >
          {image && (
            <Animated.Image
              source={image}
              fadeDuration={0}
              onLoadEnd={onImageLoaded}
              style={[
                styles.image,
                { transform: [{ scale: scaleAnimation }] }
              ]}
              resizeMode="contain"
            />
          )}
        </Animated.View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f1f1f', // Green color for plant app
  },
  image: {
    width: 200,
    height: 200,
    flex:1,
    alignSelf:"center",
    resizeMode: "cover",
    alignContent:"center",
    justifyContent:"center"
  },
});