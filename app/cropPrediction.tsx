import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, Alert, ActivityIndicator ,ScrollView} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import PrimaryButton from './../components/PrimaryButton';

import { SafeAreaView } from 'react-native-safe-area-context';

const CropPrediction = () => {
  const [image, setImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Request camera/media library permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to use this feature');
      return false;
    }
    return true;
  };

  // Pick an image from the gallery
  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        // Process the selected image
        processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Take a photo with the camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to use this feature');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        // Process the captured image
        processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Process image - resize to 256x256
  const processImage = async (uri: string) => {
    try {
      const manipulatedImage = await manipulateAsync(
        uri,
        [{ resize: { width: 256, height: 256 } }],
        { format: SaveFormat.JPEG, compress: 0.9 }
      );
      
      setImage(manipulatedImage.uri);
      setPrediction(null); // Reset previous prediction
      setErrorDetails(null); // Clear any previous errors
      predictCropHealth(manipulatedImage.uri);
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process image');
    }
  };

  // Convert image to base64
  const imageToBase64 = async (uri: string) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  };

  // Call the prediction API - first attempt with FormData
  const predictCropHealth = async (imageUri: string) => {
    setLoading(true);
    setErrorDetails(null);
    
    // First, try with FormData approach
    try {
      // Create form data to send the image
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'crop_image.jpg',
      } as any);

      console.log('Sending request to API with FormData...');
      
      // Send request to the API
      const response = await fetch('https://flashapp-9zcw.onrender.com/predict', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      });

      console.log('API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API response data:', data);
        setPrediction(data.class);
        setLoading(false);
        return;
      } else {
        // If FormData approach fails, try base64 approach
        console.log('FormData approach failed. Trying base64 approach...');
        await predictWithBase64(imageUri);
      }
    } catch (error) {
      console.error('Error with FormData approach:', error);
      // Try base64 approach as fallback
      try {
        await predictWithBase64(imageUri);
      } catch (fallbackError) {
        console.error('Both approaches failed:', fallbackError);
        setErrorDetails('Server error. Please try again later.');
        Alert.alert('Error', 'Failed to analyze crop health. Please try again later.');
        setLoading(false);
      }
    }
  };
  
  // Alternative approach using base64
  const predictWithBase64 = async (imageUri: string) => {
    try {
      const base64Image = await imageToBase64(imageUri);
      
      const response = await fetch('https://flashapp-9zcw.onrender.com/predict', {
        method: 'POST',
        body: JSON.stringify({
          image: base64Image
        }),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('Base64 API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`API returned status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('API response data:', data);
      setPrediction(data.class);
    } catch (error) {
      console.error('Error with base64 approach:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // For debugging purposes
  const checkApiConnection = async () => {
    try {
      const response = await fetch('https://flashapp-9zcw.onrender.com/', {
        method: 'GET',
      });
      console.log('API connection test status:', response.status);
      Alert.alert('API Test', `Connection status: ${response.status}`);
    } catch (error) {
      console.error('API connection test failed:', error);
      Alert.alert('API Test', `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Render information about the crop based on prediction
  const renderCropInfo = () => {
    if (errorDetails) {
      return (
        <View style={styles.infoContainer}>
          <Text style={[styles.predictionText, { color: '#F44336' }]}>Error</Text>
          <Text style={styles.infoText}>{errorDetails}</Text>
        </View>
      );
    }
    
    if (!prediction) return null;

    let message = '';
    let color = '';

    switch (prediction) {
      case 'Healthy':
        message = 'Your crop appears to be healthy. Continue your current care practices.';
        color = '#4CAF50'; // Green
        break;
      case 'Bacterial Blight':
        message = 'Bacterial Blight detected. Consider copper-based sprays and improve air circulation.';
        color = '#F44336'; // Red
        break;
      case 'Fungal Infection':
        message = 'Fungal Infection detected. Apply appropriate fungicide and reduce leaf wetness.';
        color = '#FF9800'; // Orange
        break;
      default:
        message = `Analysis: ${prediction}. Please consult an agricultural expert for specific advice.`;
        color = '#2196F3'; // Blue
    }

    return (
      <View style={styles.infoContainer}>
        <Text style={[styles.predictionText, { color }]}>{prediction}</Text>
        <Text style={styles.infoText}>{message}</Text>
      </View>
    );
  };

  return (
    <ScrollView>
    <SafeAreaView style={{ flex: 1.5 }}>
      
    <View style={styles.container}>
      <Text style={styles.title}>Crop Health Analyzer</Text>
      <Text style={styles.subtitle}>Take or select a photo of your crop for analysis</Text>
      
      <View style={styles.buttonContainer}>
        <PrimaryButton 
          title="Take Photo" 
          onPress={takePhoto} 
          style={styles.button}
          disabled={loading}
        />
        <PrimaryButton 
          title="Pick from Gallery" 
          onPress={pickImage} 
          style={styles.button}
          disabled={loading}
        />
      </View>

      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#3563EB" />
              <Text style={styles.loadingText}>Analyzing crop...</Text>
            </View>
          )}
        </View>
      )}

      {renderCropInfo()}
      
      {/* Debug button - remove in production */}
      <PrimaryButton 
        title="Test API Connection" 
        onPress={checkApiConnection}
        style={styles.debugButton}
      />
    </View>
    </SafeAreaView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: wp('5%'),
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: hp('1%'),
  },
  subtitle: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
    marginBottom: hp('3%'),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('3%'),
  },
  button: {
    flex: 0.48,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: hp('3%'),
    position: 'relative',
  },
  image: {
    width: wp('70%'),
    height: wp('70%'),
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp('2%'),
  },
  loadingText: {
    marginTop: hp('1%'),
    color: '#3563EB',
    fontWeight: '500',
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    padding: wp('5%'),
    borderRadius: wp('2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  predictionText: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    marginBottom: hp('1%'),
    textAlign: 'center',
  },
  infoText: {
    fontSize: wp('4%'),
    color: '#4B5563',
    lineHeight: wp('6%'),
  },
  debugButton: {
    marginTop: hp('3%'),
    backgroundColor: '#9CA3AF',
  },
});

export default CropPrediction;