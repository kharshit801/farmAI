import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { Julep } from '@julep/sdk';
import Header from '@/components/Header';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// API keys and constants (replace with secure storage in production)
const OCR_API_KEY = 'K85534551388957';
const JULEP_AGENT_ID = '06802005-adc9-75f1-8000-5ea756eb8532';
const JULEP_API_KEY = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTAxNTkwMTcsImlhdCI6MTc0NDk3NTAxNywic3ViIjoiNjVhMWE5MzYtYjBlMy01OTI0LTk3NzQtNjU1NDVmYmYwNTgyIn0.QbU03Bwv5Qv4Wv5sKuXu26wE9vac0lguHwKlUfzVeLvwVY1-UlMT7kr3h8K6XQEQJUn925NB5OD4uLR0jPHRAQ';

// Julep task definition
const julepTaskDefinition = {
  name: 'Soil Health Analysis',
  description: 'Analyze soil health card data and provide concise farming recommendations',
  main: [
    {
      type: 'prompt',
      prompt: "$ f'You are an expert agronomist AI assistant. Analyze the following soil health card data and provide concise, actionable recommendations to maximize crop yield. Focus on pH adjustment, nutrient management (N, P, K, S, Zn, Fe, Mn, Cu, B), and crop-specific advice. Data: {steps[0].input.soilData}' ",
    },
  ],
};

// Interfaces for TypeScript
interface OCRResult {
  ParsedResults?: Array<{
    ParsedText: string;
  }>;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string;
}

interface JulepResult {
  status: string;
  output?: {
    choices?: Array<{
      message?: {
        content: string;
      };
    }>;
  };
  error?: {
    message: string;
  };
}

const SoilCardScreen = () => {
  const [image, setImage] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showRecommendations, setShowRecommendations] = useState<boolean>(false);

  // Button animation states
  const uploadScale = useSharedValue(1);
  const cancelScale = useSharedValue(1);
  const analyzeScale = useSharedValue(1);

  // Initialize Julep client
  const julepClient = useMemo(() => {
    if (!JULEP_API_KEY) {
      Alert.alert('Error', 'Julep API key is missing.');
      return null;
    }
    return new Julep({ apiKey: JULEP_API_KEY });
  }, []);

  // Request media library permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to select an image.');
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
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.canceled) {
        setImage(result.assets[0].uri);
        setRecommendations(null);
        setErrorDetails(null);
        setShowRecommendations(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Reset image and state
  const resetImage = useCallback(() => {
    setImage(null);
    setRecommendations(null);
    setErrorDetails(null);
    setShowRecommendations(false);
  }, []);

  // Process soil health card
  const processSoilCard = async () => {
    if (!image) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    setIsProcessing(true);
    setErrorDetails(null);

    try {
      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create FormData for OCR API
      const formData = new FormData();
      const fileName = image.split('/').pop();
      formData.append('file', {
        uri: image,
        type: 'image/jpeg',
        name: fileName || 'upload.jpg',
      } as any);
      formData.append('language', 'eng');
      formData.append('apikey', OCR_API_KEY);
      formData.append('isTable', 'true');

      // Send OCR request
      const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'apikey': OCR_API_KEY,
        },
        body: formData,
      });

      const ocrResult: OCRResult = await ocrResponse.json();

      if (ocrResult.IsErroredOnProcessing) {
        throw new Error(ocrResult.ErrorMessage || 'Error processing image');
      }

      const extractedText = ocrResult?.ParsedResults?.[0]?.ParsedText || '';
      if (!extractedText) {
        throw new Error('No text extracted from the image. Try a clearer image or different lighting.');
      }

      // Julep AI Analysis
      if (!julepClient) {
        throw new Error('Julep client not initialized.');
      }

      const task = await julepClient.tasks.create(JULEP_AGENT_ID, julepTaskDefinition);
      const execution = await julepClient.executions.create(task.id, {
        input: { soilData: extractedText },
      });

      let result: JulepResult;
      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        result = await julepClient.executions.get(execution.id);
        if (result.status === 'succeeded') {
          const botText = result.output?.choices?.[0]?.message?.content || 'No recommendations available.';
          setRecommendations(botText);
          setShowRecommendations(true);
          break;
        } else if (result.status === 'failed') {
          throw new Error(result.error?.message || 'Analysis failed');
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (attempts >= maxAttempts) {
        throw new Error('Analysis is taking too long. Please try again later.');
      }
    } catch (error: any) {
      console.error('Processing error:', error);
      setErrorDetails(error.message || 'Processing failed. Please try again.');
      Alert.alert('Error', error.message || 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Button animation handlers
  const handlePressIn = (scale: Animated.SharedValue<number>) => {
    scale.value = withSpring(0.98); // Subtle scale for minimalistic feel
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = (scale: Animated.SharedValue<number>) => {
    scale.value = withSpring(1);
  };

  // Animated styles for buttons
  const uploadAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: uploadScale.value }],
  }));

  const cancelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cancelScale.value }],
  }));

  const analyzeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: analyzeScale.value }],
  }));

  // Render results card
  const renderResults = () => {
    if (errorDetails) {
      return (
        <View style={styles.resultCard}>
          <View style={[styles.statusIndicator, { backgroundColor: '#F44336' }]} />
          <Text style={[styles.predictionText, { color: '#F44336' }]}>Error</Text>
          <Text style={styles.descriptionText}>{errorDetails}</Text>
        </View>
      );
    }

    if (!recommendations) return null;

    return (
      <View style={styles.resultCard}>
        <View style={[styles.statusIndicator, { backgroundColor: '#6A994E' }]} />
        <Text style={[styles.predictionText, { color: '#6A994E' }]}>Soil Analysis</Text>
        <Text style={styles.descriptionText}>
          Your soil health card has been analyzed successfully.
        </Text>
        {!showRecommendations && (
          <Animated.View style={[styles.buttonWrapper, analyzeAnimatedStyle]}>
            <TouchableOpacity
              style={styles.treatmentButton}
              onPress={() => setShowRecommendations(true)}
              onPressIn={() => handlePressIn(analyzeScale)}
              onPressOut={() => handlePressOut(analyzeScale)}
            >
              <View style={[styles.buttonContent, { backgroundColor: '#6A994E' }]}>
                <Text style={styles.treatmentButtonText}>View Recommendations</Text>
                <Ionicons name="chevron-down-outline" size={wp('5%')} color="#fff" style={styles.buttonIcon} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
        {showRecommendations && (
          <View style={styles.treatmentContainer}>
            <Text style={styles.treatmentTitle}>Recommendations</Text>
            <Text style={styles.treatmentText}>{recommendations}</Text>
            <TouchableOpacity
              style={styles.hideButton}
              onPress={() => setShowRecommendations(false)}
            >
              <Text style={styles.hideButtonText}>Hide Recommendations</Text>
              <Ionicons name="chevron-up-outline" size={wp('5%')} color="#6A994E" />
            </TouchableOpacity>
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
          {!image && (
            <View style={styles.placeholderContainer}>
              <Ionicons name="document-outline" size={wp('25%')} color="#E5E7EB" />
              <Text style={styles.subtitle}>
                Select your soil health card for analysis
              </Text>
            </View>
          )}

          {image && (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: image }} style={styles.image} />
              {isProcessing && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={styles.loadingText}>Analyzing...</Text>
                </View>
              )}
            </View>
          )}

          {renderResults()}

          <View style={styles.buttonContainer}>
            <Animated.View style={[styles.buttonWrapper, uploadAnimatedStyle]}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickImage}
                onPressIn={() => handlePressIn(uploadScale)}
                onPressOut={() => handlePressOut(uploadScale)}
                disabled={isProcessing}
              >
                <View style={[styles.buttonContent, isProcessing && styles.disabledButton, { backgroundColor: '#1F1F1F' }]}>
                  <Ionicons name="cloud-upload-outline" size={wp('6%')} color="#fff" />
                  <Text style={styles.buttonText}>Choose File</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {image && (
              <Animated.View style={[styles.buttonWrapper, cancelAnimatedStyle]}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={resetImage}
                  onPressIn={() => handlePressIn(cancelScale)}
                  onPressOut={() => handlePressOut(cancelScale)}
                  disabled={isProcessing}
                >
                  <View style={[styles.buttonContent, isProcessing && styles.disabledButton, { backgroundColor: '#1F1F1F' }]}>
                    <Ionicons name="close-outline" size={wp('6%')} color="#fff" />
                    <Text style={styles.buttonText}>Cancel</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}

            {image && (
              <Animated.View style={[styles.buttonWrapper, analyzeAnimatedStyle]}>
                <TouchableOpacity
                  style={styles.analyzeButton}
                  onPress={processSoilCard}
                  onPressIn={() => handlePressIn(analyzeScale)}
                  onPressOut={() => handlePressOut(analyzeScale)}
                  disabled={isProcessing}
                >
                  <View style={[styles.buttonContent, isProcessing && styles.disabledButton, { backgroundColor: '#6A994E' }]}>
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="analytics-outline" size={wp('6%')} color="#fff" />
                        <Text style={styles.buttonText}>Analyze</Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}
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
    height: wp('67.5%'), // Maintain 4:3 aspect ratio
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
    fontSize: wp('4%'),
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
    borderRadius: wp('3%'),
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
  },
  treatmentButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: wp('4.2%'),
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
  hideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('1%'),
    marginTop: hp('2%'),
  },
  hideButtonText: {
    color: '#6A994E',
    fontWeight: '600',
    fontSize: wp('4%'),
    marginRight: wp('2%'),
  },
  buttonContainer: {
    marginBottom: hp('3%'),
  },
  buttonWrapper: {
    marginBottom: hp('2%'),
  },
  uploadButton: {
    borderRadius: wp('3%'),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cancelButton: {
    borderRadius: wp('3%'),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  analyzeButton: {
    borderRadius: wp('3%'),
    overflow: 'hidden',
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
    fontSize: wp('4.2%'),
    marginLeft: wp('2%'),
  },
});

export default SoilCardScreen;