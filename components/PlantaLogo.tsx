// components/PlantaLogo.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Easing, Image } from 'react-native';

type PlantaLogoProps = {
  size?: number;
  animated?: boolean;
};

export default function PlantaLogo({ size = 120, animated = true }: PlantaLogoProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      // Create a sequence of animations
      Animated.loop(
        Animated.sequence([
          // Pulse animation
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Create a subtle rotation animation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 6000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [animated, scaleAnim, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            width: size,
            height: size,
            transform: [
              { scale: scaleAnim },
              { rotate: animated ? rotate : '0deg' },
            ],
          },
        ]}
      >
        <Image
          source={require('../assets/images/logoPlanta.png')}
          style={{ width: size * 0.8, height: size * 0.8 }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
  },
});