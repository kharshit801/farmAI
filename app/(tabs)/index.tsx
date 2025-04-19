import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import LottieView from 'lottie-react-native';
import Header from '@/components/Header';
import PrimaryButton from '@/components/PrimaryButton';

export default function HomeScreen() {
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
          onPress={() => Alert.alert("Something is cooking")}
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
  analyzeButton: {
    backgroundColor: '#6A994E',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('8%'),
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontWeight: '600'
  }
});