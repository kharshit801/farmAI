import React from 'react';
import { SafeAreaView, StyleSheet, ScrollView, Pressable, View, Alert } from 'react-native';
import { Screen } from 'react-native-screens';
import Header from '@/components/Header';
import CropCategories from '@/components/CropCategories';
import WeatherCard from '@/components/WeatherCard';
import HealYourCrop from '@/components/HealYourCrop';
import ManageFields from '@/components/ManageFields';
import FeatureCardsSection from '@/components/sections/FeatureCardsSection';
import LottieView from 'lottie-react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useRouter } from 'expo-router';


export default function CropScreen() {
  const router = useRouter(); // Get the router instance

  
  const handleChatPress = () => {
  // Navigate to the chatbot screen
  router.push('/chatbot');
}

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Screen style={styles.container}>
          <Header />
          <CropCategories />
          <WeatherCard />
          <HealYourCrop />
          <ManageFields />
          <FeatureCardsSection />
        </Screen>
      </ScrollView>

      {/* Floating Chat Bubble */}
      <Pressable
        style={styles.chatBubble}
        onPress={handleChatPress}
        android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
      >
        <LottieView
          source={require('../../assets/lottie/chatbubble.json')}
          autoPlay
          loop={true}
          style={styles.lottieIcon}
        />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  chatBubble: {
    position: 'absolute',
    bottom: wp('4%'), // Position at bottom-right corner
    right: wp('4%'),
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('5%'),
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Clip the ripple effect on Android
    zIndex: 1000, // Ensure it appears above all other components
    elevation: 10, // For Android to ensure it renders above other elements
  },
  lottieIcon: {
    width: wp('16%'),
    height: wp('16%'),
  },
});
