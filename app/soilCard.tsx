import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { Julep } from '@julep/sdk';
import Header from '@/components/Header';
const OCR_API_KEY = 'K85534551388957';
const JULEP_AGENT_ID = '06802005-adc9-75f1-8000-5ea756eb8532';
const JULEP_API_KEY = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTAxNTkwMTcsImlhdCI6MTc0NDk3NTAxNywic3ViIjoiNjVhMWE5MzYtYjBlMy01OTI0LTk3NzQtNjU1NDVmYmYwNTgyIn0.QbU03Bwv5Qv4Wv5sKuXu26wE9vac0lguHwKlUfzVeLvwVY1-UlMT7kr3h8K6XQEQJUn925NB5OD4uLR0jPHRAQ';

const julepTaskDefinition = {
  name: 'Soil Health Analysis',
  description: 'Analyze soil health card data and provide concise farming recommendations',
  main: [
    {
      type: 'prompt',
      prompt: "$ f'You are an expert agronomist AI assistant. Analyze the following soil health card data and provide concise, actionable recommendations to maximize crop yield. Focus on pH adjustment, nutrient management (N, P, K, S, Zn, Fe, Mn, Cu, B), and crop-specific advice. Data: {steps[0].input.soilData} response give in hindi' ",
    },
  ],
};

// Define interfaces for better TypeScript support
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
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const julepClient = useMemo(() => {
    if (!JULEP_API_KEY) {
      Alert.alert('Error', 'Julep API key is missing.');
      return null;
    }
    return new Julep({ apiKey: JULEP_API_KEY });
  }, []);

 const pickImage = async () => {
  try {
    // Request media library permissions first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permission to upload images.');
      return;
    }
    
    // Use the correct MediaTypeOptions that works with your version
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Using MediaTypeOptions instead of MediaType
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      console.log("Image selected:", result.assets[0].uri);
    }
  } catch (error) {
    console.error('Image picker error:', error);
    Alert.alert('Error', 'Failed to pick image');
  }
};
  const processSoilCard = async () => {
    if (!image) {
        Alert.alert('Error', 'Please select an image first');
        return;
      }
    
      setIsProcessing(true);
    
      try {
        console.log("Processing image:", image);
        
        // Convert image to base64
        const base64 = await FileSystem.readAsStringAsync(image, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        console.log("Image converted to base64, length:", base64.length);
    
        // Create FormData instead of JSON
        const formData = new FormData();
        
        // Add file as blob with correct MIME type
        const imageInfo = await FileSystem.getInfoAsync(image);
        const fileName = image.split('/').pop();
        
        // Create file blob
        const file = {
          uri: image,
          type: 'image/jpeg', // You might need to get the actual mime type
          name: fileName || 'upload.jpg',
        };
        
        formData.append('file', file);
        formData.append('language', 'eng');
        formData.append('apikey', OCR_API_KEY);
        formData.append('isTable', 'true');
        
        console.log("Sending OCR request with FormData");
        
        const ocrResponse = await fetch(
          'https://api.ocr.space/parse/image',
          {
            method: 'POST',
            headers: {
              'apikey': OCR_API_KEY,
            },
            body: formData,
          }
        );
        
        const ocrResult = await ocrResponse.json();
        console.log("OCR Result:", JSON.stringify(ocrResult));
      
      if (ocrResult.IsErroredOnProcessing) {
        Alert.alert('OCR Error', ocrResult.ErrorMessage || 'Error processing image');
        setIsProcessing(false);
        return;
      }
      
      const extractedText = ocrResult?.ParsedResults?.[0]?.ParsedText || '';

      if (!extractedText) {
        Alert.alert('Error', 'No text extracted from the image. Try a clearer image or different lighting.');
        setIsProcessing(false);
        return;
      }
      
      console.log("Extracted text:", extractedText.substring(0, 100) + "...");

      // Step 2: Julep AI Analysis
      if (!julepClient) {
        Alert.alert('Error', 'Julep client not initialized.');
        setIsProcessing(false);
        return;
      }

      console.log("Creating Julep task");
      const task = await julepClient.tasks.create(JULEP_AGENT_ID, julepTaskDefinition);
      console.log("Executing Julep task");
      const execution = await julepClient.executions.create(task.id, {
        input: { soilData: extractedText },
      });

      let result: JulepResult;
      let attempts = 0;
      const maxAttempts = 30; // To avoid infinite loops
      
      console.log("Waiting for Julep analysis");
      while (attempts < maxAttempts) {
        result = await julepClient.executions.get(execution.id);
        console.log("Julep status:", result.status);
        
        if (result.status === 'succeeded') {
          const botText = result.output?.choices?.[0]?.message?.content || 'No recommendations available.';
          console.log("Analysis complete");
          setRecommendations(botText);
          setModalVisible(true);
          break;
        } else if (result.status === 'failed') {
          Alert.alert('Error', `Analysis failed: ${result.error?.message || 'Unknown error'}`);
          break;
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (attempts >= maxAttempts) {
        Alert.alert('Timeout', 'Analysis is taking too long. Please try again later.');
      }
    } catch (error: any) {
      console.error('Processing error:', error);
      Alert.alert('Error', `Processing failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
        <Header/>
      <View style={styles.uploadContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="document-outline" size={wp('20%')} color="#003366" />
            <Text style={styles.placeholderText}>Select your soil health card</Text>
          </View>
        )}
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Ionicons name="cloud-upload-outline" size={wp('6%')} color="white" />
          <Text style={styles.buttonText}>Choose File</Text>
        </TouchableOpacity>
        {image && (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={processSoilCard}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.buttonText}>Analyze Card</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Modal for Recommendations */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
            
          <View style={styles.modalContainer}>

            <View style={styles.modalContent}>
                <ScrollView>
              <Text style={styles.modalTitle}>Recommendations</Text>
              <Text style={styles.modalText}>{recommendations}</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: wp('4%'),
  },
  title: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: hp('4%'),
    textAlign: 'center',
  },
  uploadContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: wp('80%'),
    height: hp('40%'),
    borderWidth: 2,
    borderColor: '#003366',
    borderStyle: 'dashed',
    borderRadius: wp('4%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('4%'),
  },
  placeholderText: {
    marginTop: hp('2%'),
    fontSize: wp('4%'),
    color: '#003366',
    textAlign: 'center',
  },
  image: {
    width: wp('80%'),
    height: hp('40%'),
    borderRadius: wp('4%'),
    marginBottom: hp('4%'),
  },
  uploadButton: {
    backgroundColor: '#003366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp('4%'),
    borderRadius: wp('2%'),
    width: wp('80%'),
    marginBottom: hp('2%'),
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: wp('4%'),
    borderRadius: wp('2%'),
    width: wp('80%'),
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: wp('4%'),
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: wp('5%'),
    borderRadius: wp('3%'),
    width: wp('80%'),
    maxHeight: hp('60%'),
  },
  modalTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: hp('2%'),
    textAlign: 'center',
  },
  modalText: {
    fontSize: wp('4%'),
    color: '#1F2937',
    marginBottom: hp('3%'),
  },
  modalButton: {
    backgroundColor: '#003366',
    padding: wp('3%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
  },
});

export default SoilCardScreen;