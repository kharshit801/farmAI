import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import PrimaryButton from './PrimaryButton';

const HealYourCrop: React.FC = () => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Heal your crop</Text>
      <View style={styles.healStepsContainer}>
        <View style={styles.healStep}>
          <View style={styles.healStepIcon}>
            <LottieView
              source={require('../assets/lottie/camera.json')} // Replace with your camera Lottie file
              autoPlay
              loop
              style={styles.lottieIcon}
            />
          </View>
          <Text style={styles.healStepText}>Take a picture</Text>
        </View>
        <LottieView
          source={require('../assets/lottie/arrow.json')} // Replace with your arrow Lottie file
          autoPlay
          loop
          style={styles.lottieArrow}
        />
        <View style={styles.healStep}>
          <View style={styles.healStepIcon}>
            <LottieView
              source={require('../assets/lottie/document.json')} // Replace with your document Lottie file
              autoPlay
              loop
              style={styles.lottieIcon}
            />
          </View>
          <Text style={styles.healStepText}>See diagnosis</Text>
        </View>
        <LottieView
          source={require('../assets/lottie/arrow.json')} // Replace with your arrow Lottie file
          autoPlay
          loop
          style={styles.lottieArrow}
        />
        <View style={styles.healStep}>
          <View style={styles.healStepIcon}>
            <LottieView
              source={require('../assets/lottie/medicine.json')} // Replace with your medicine bottle Lottie file
              autoPlay
              loop
              style={styles.lottieIcon}
            />
          </View>
          <Text style={styles.healStepText}>Get medicine</Text>
        </View>
      </View>
      <PrimaryButton title="Take a picture" />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: wp('4%'),
    marginVertical: hp('2%'),
  },
  sectionTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '600',
    color: '#111827',
    marginBottom: hp('2%'),
  },
  healStepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: wp('4%'),
    borderRadius: wp('3%'),
    marginBottom: hp('2%'),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  healStep: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  healStepIcon: {
    width: wp('12%'),
    height: wp('12%'),
    borderWidth: 1,
    borderColor: '#9CA3AF',
    borderRadius: wp('1%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  lottieIcon: {
    width: wp('11%'),
    height: wp('11%'),
  },
  lottieArrow: {
    width: wp('16%'),
    height: wp('16 %'),
  },
  healStepText: {
    fontSize: wp('3.5%'),
    color: '#4B5563',
    textAlign: 'center',
    maxWidth: wp('20%'),
  },
});

export default HealYourCrop;