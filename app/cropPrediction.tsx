import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, Alert, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import PrimaryButton from './../components/PrimaryButton';
import Header from '@/components/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const CropPrediction = () => {
  const [image, setImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showTreatment, setShowTreatment] = useState(false);

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
      setShowTreatment(false); // Reset treatment view
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

  // Disease information and treatments
  const getDiseaseInfo = () => {
    if (!prediction) return { description: '', treatment: '', color: '' };

    switch (prediction) {
      case 'Healthy':
        return {
          description: 'Your crop appears to be in excellent condition with no visible signs of disease.',
          treatment: 'Continue your current care practices. Regular monitoring, adequate watering, and proper nutrition will help maintain plant health.',
          color: '#4CAF50' // Green
        };
      case 'Late Blight':
        return {
          description: 'Late Blight is a serious disease that causes dark, water-soaked spots on leaves, stems and fruits.',
          treatment: '1. Apply copper-based fungicides or approved products containing chlorothalonil.\n2. Improve air circulation around plants by proper spacing.\n3. Water at soil level and avoid wetting foliage.\n4. Remove and destroy infected plant material.\n5. Consider resistant varieties for future plantings.',
          color: '#F44336' // Red
        };
        case 'Early Blight':
          return {
            description: 'Early Blight causes dark, concentric rings forming a \"bull\'s-eye\" pattern on lower leaves first.',
            treatment: '1. Apply appropriate fungicides containing chlorothalonil, mancozeb, or copper.\n2. Prune lower branches to increase air circulation.\n3. Mulch around plants to prevent soil splash.\n4. Rotate crops – don\'t plant tomatoes or potatoes in the same location for 3-4 years.\n5. Remove and destroy infected leaves and plants at the end of the season.',
            color: '#FF9800' // Orange
          };
      default:
        return {
          description: `Analysis shows potential issues with your crop that may require attention.`,
          treatment: 'Please consult an agricultural expert for specific advice regarding your crop condition.',
          color: '#2196F3' // Blue
        };
    }
  };

  // Render prediction results
  const renderResults = () => {
    if (errorDetails) {
      return (
        <View style={styles.resultCard}>
          <Text style={[styles.predictionText, { color: '#F44336' }]}>Error</Text>
          <Text style={styles.descriptionText}>{errorDetails}</Text>
        </View>
      );
    }

    if (!prediction) return null;

    const { description, treatment, color } = getDiseaseInfo();

    return (
      <View style={styles.resultCard}>
        <View style={[styles.statusIndicator, { backgroundColor: color }]} />
        <Text style={[styles.predictionText, { color }]}>{prediction}</Text>
        <Text style={styles.descriptionText}>{description}</Text>
        
        {prediction !== 'Healthy' && !showTreatment && (
          <TouchableOpacity 
            style={styles.treatmentButton}
            onPress={() => setShowTreatment(true)}
          >
            <Text style={styles.treatmentButtonText}>See Treatment</Text>
            <Ionicons name="medical-outline" size={wp('5%')} color="#fff" style={styles.buttonIcon} />
          </TouchableOpacity>
        )}

        {showTreatment && (
          <View style={styles.treatmentContainer}>
            <Text style={styles.treatmentTitle}>Recommended Treatment</Text>
            <Text style={styles.treatmentText}>{treatment}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          {/* <Text style={styles.title}>Crop Health Analyzer</Text> */}
          
          {!image && (
            <View style={styles.placeholderContainer}>
              <Ionicons name="leaf-outline" size={wp('25%')} color="#E5E7EB" />
              <Text style={styles.subtitle}>Take or select a photo of your crop for analysis</Text>
            </View>
          )}

          {image && (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: image }} style={styles.image} />
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={styles.loadingText}>Analyzing crop...</Text>
                </View>
              )}
            </View>
          )}

          {renderResults()}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.cameraButton, loading && styles.disabledButton]} 
              onPress={takePhoto}
              disabled={loading}
            >
              <Ionicons name="camera-outline" size={wp('8%')} color="#fff" />
              <Text style={styles.buttonText}>Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.galleryButton, loading && styles.disabledButton]} 
              onPress={pickImage}
              disabled={loading}
            >
              <Ionicons name="images-outline" size={wp('8%')} color="#fff" />
              <Text style={styles.buttonText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: wp('5%'),
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: hp('2%'),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
    textAlign: 'center',
    marginTop: hp('2%'),
    maxWidth: wp('70%'),
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: hp('40%'),
    marginVertical: hp('3%'),
    backgroundColor: '#F9FAFB',
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  imageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: hp('3%'),
    position: 'relative',
    borderRadius: wp('4%'),
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  image: {
    width: wp('90%'),
    height: wp('90%'),
    borderRadius: wp('4%'),
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp('4%'),
  },
  loadingText: {
    marginTop: hp('1%'),
    color: '#FFFFFF',
    fontWeight: '500',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    padding: wp('5%'),
    borderRadius: wp('4%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: hp('3%'),
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statusIndicator: {
    position: 'absolute',
    top: wp('5%'),
    left: 0,
    width: wp('1%'),
    height: wp('10%'),
    borderTopRightRadius: wp('1%'),
    borderBottomRightRadius: wp('1%'),
  },
  predictionText: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    marginBottom: hp('1%'),
    paddingLeft: wp('3%'),
  },
  descriptionText: {
    fontSize: wp('4%'),
    color: '#4B5563',
    lineHeight: wp('6.5%'),
    paddingLeft: wp('3%'),
    marginBottom: hp('2%'),
  },
  treatmentButton: {
    backgroundColor: '#6A994E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1.5%'),
    borderRadius: wp('3%'),
    marginTop: hp('1%'),
  },
  treatmentButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: wp('4%'),
  },
  buttonIcon: {
    marginLeft: wp('2%'),
  },
  treatmentContainer: {
    marginTop: hp('2%'),
    paddingTop: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  treatmentTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '600',
    color: '#111827',
    marginBottom: hp('1%'),
  },
  treatmentText: {
    fontSize: wp('3.8%'),
    color: '#4B5563',
    lineHeight: wp('6%'),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('3%'),
  },
  cameraButton: {
    flex: 0.48,
    backgroundColor: '#6A994E',
    borderRadius: wp('3%'),
    paddingVertical: hp('2%'),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  galleryButton: {
    flex: 0.48,
    backgroundColor: '#4B5563',
    borderRadius: wp('3%'),
    paddingVertical: hp('2%'),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: wp('4%'),
    marginLeft: wp('2%'),
  },
});

export default CropPrediction;