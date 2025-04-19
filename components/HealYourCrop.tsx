import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import LottieView from 'lottie-react-native';
import PrimaryButton from './PrimaryButton';
import { useDiagnosis } from '../context/DiagnosisContext';
import { useRouter } from 'expo-router';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

const HealYourCrop: React.FC = () => {
  const router = useRouter();
  const { setDiagnosisData } = useDiagnosis(); 

  const openCamera = async () => {
    try {
      // Request camera permissions
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera access is required to take a picture.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      // Handle image capture result
      if (!result.canceled && result.assets?.length > 0) {
        const uri = result.assets[0].uri;
        console.log('Image captured:', uri);

        // Create form data for API request
        const formData = new FormData();
        formData.append('file', {
          uri: uri,
          name: 'photo.jpg',
          type: 'image/jpeg',
        } as unknown as Blob);

        console.log('Uploading image to API...');
        
        // Send image to API
        const response = await fetch('https://flashapp-9zcw.onrender.com/predict', {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('API response data:', data);
        
        // Extract the "class" property from the response instead of "result"
        setDiagnosisData({
          imageUri: uri,
          result: data.class || 'No result found.',  // Use data.class instead of data.result
        });

        console.log('Navigating to prediction result screen...');
        // Navigate to the prediction result screen
        router.push('/Predictionresult');
      }
    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Error', `Failed to process your image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Heal your crop</Text>
      <View style={styles.healStepsContainer}>
        <View style={styles.healStep}>
          <View style={styles.healStepIcon}>
            <LottieView
              source={require('../assets/lottie/camera.json')}
              autoPlay
              loop
              style={styles.lottieIcon}
            />
          </View>
          <Text style={styles.healStepText}>Take a picture</Text>
        </View>
        <LottieView
          source={require('../assets/lottie/arrow.json')}
          autoPlay
          loop
          style={styles.lottieArrow}
        />
        <View style={styles.healStep}>
          <View style={styles.healStepIcon}>
            <LottieView
              source={require('../assets/lottie/document.json')}
              autoPlay
              loop
              style={styles.lottieIcon}
            />
          </View>
          <Text style={styles.healStepText}>See diagnosis</Text>
        </View>
        <LottieView
          source={require('../assets/lottie/arrow.json')}
          autoPlay
          loop
          style={styles.lottieArrow}
        />
        <View style={styles.healStep}>
          <View style={styles.healStepIcon}>
            <LottieView
              source={require('../assets/lottie/medicine.json')}
              autoPlay
              loop
              style={styles.lottieIcon}
            />
          </View>
          <Text style={styles.healStepText}>Get medicine</Text>
        </View>
      </View>
      <PrimaryButton title="Take a picture" onPress={() => router.push('/cropPrediction')} />
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
    height: wp('16%'),
  },
  healStepText: {
    fontSize: wp('3.5%'),
    color: '#4B5563',
    textAlign: 'center',
    maxWidth: wp('20%'),
  },
});

export default HealYourCrop;