

import React from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import Header from '@/components/Header';
import PrimaryButton from '@/components/PrimaryButton';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <View style={styles.content}>
        <LottieView
          source={require('../../assets/lottie/cow.json')}
          autoPlay
          loop
          style={styles.animation}
        />
        <PrimaryButton 
          title='Analyse Your Cattle Health' 
          onPress={() => router.push('/cattlePrediction')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('5%')
  },
  animation: {
    width: wp('80%'),
    height: hp('35%'),
    marginBottom: hp('5%')
  },
});