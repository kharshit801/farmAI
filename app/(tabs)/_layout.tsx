import { Tabs } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

// Custom tab bar button component with animation
function TabBarIcon({ name, color, focused }) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          scale: withTiming(focused ? 1.2 : 1, { 
            duration: 200,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
          }) 
        }
      ],
    };
  });

  return (
    <Animated.View style={[styles.iconContainer, animatedStyle]}>
      <Ionicons name={name} size={24} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  
  // Determine if we're on iOS and adjust accordingly
  const isIOS = Platform.OS === 'ios';
  
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#8E8E93' : '#8E8E93',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: isIOS ? 0 : 4,
        },
        tabBarStyle: {
          height: isIOS ? 88 : 64,
          paddingBottom: isIOS ? insets.bottom : 8,
          paddingTop: 8,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          backgroundColor: colorScheme === 'dark' 
            ? 'rgba(30, 30, 30, 0.85)' 
            : 'rgba(255, 255, 255, 0.95)',
        },
        tabBarBackground: () => (
          <BlurView 
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            intensity={80} 
            style={StyleSheet.absoluteFill} 
          />
        ),
        headerShown: false,
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        },
        headerTitleStyle: {
          color: Colors[colorScheme ?? 'light'].text,
          fontWeight: 'bold',
        },
        tabBarIcon: ({ color, focused }) => {
          let iconName;
          
          if (route.name === 'index') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'community') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'shop') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          
          return <TabBarIcon name={iconName} color={color} focused={focused} />;
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'Planta',
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  }
});