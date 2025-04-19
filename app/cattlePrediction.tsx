// import React, { useState, useRef } from 'react';
// import {
//   StyleSheet,
//   Text,
//   View,
//   SafeAreaView,
//   Alert,
//   Image,
//   ActivityIndicator,
//   ScrollView,
//   TouchableOpacity,
//   StatusBar,
// } from 'react-native';
// import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
// import LottieView from 'lottie-react-native';
// import Header from '@/components/Header';
// import * as ImagePicker from 'expo-image-picker';
// import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
// import * as FileSystem from 'expo-file-system';
// import { Ionicons } from '@expo/vector-icons';
// import * as Haptics from 'expo-haptics';

// export default function HomeScreen() {
//   const [image, setImage] = useState(null);
//   const [prediction, setPrediction] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [errorDetails, setErrorDetails] = useState(null);
//   const scrollViewRef = useRef(null);

//   // Request camera/media library permissions
//   const requestPermissions = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert(
//         'Permission Required', 
//         'Please grant camera roll permissions to use this feature',
//         [{ text: 'OK', onPress: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error) }]
//       );
//       return false;
//     }
//     return true;
//   };

//   // Pick an image from the gallery
//   const pickImage = async () => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
//     const hasPermission = await requestPermissions();
//     if (!hasPermission) return;
    
//     try {
//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [1, 1],
//         quality: 1,
//       });
      
//       if (!result.canceled) {
//         processImage(result.assets[0].uri);
//       }
//     } catch (error) {
//       console.error('Error picking image:', error);
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//       Alert.alert('Error', 'Failed to select image');
//     }
//   };

//   // Take a photo with the camera
//   const takePhoto = async () => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
//     const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
//     if (status !== 'granted') {
//       Alert.alert(
//         'Permission Required', 
//         'Please grant camera permissions to use this feature',
//         [{ text: 'OK', onPress: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error) }]
//       );
//       return;
//     }
    
//     try {
//       const result = await ImagePicker.launchCameraAsync({
//         allowsEditing: true,
//         aspect: [1, 1],
//         quality: 1,
//       });
      
//       if (!result.canceled) {
//         processImage(result.assets[0].uri);
//       }
//     } catch (error) {
//       console.error('Error taking photo:', error);
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//       Alert.alert('Error', 'Failed to take photo');
//     }
//   };

//   // Process image - resize to 256x256
//   const processImage = async (uri) => {
//     try {
//       const manipulatedImage = await manipulateAsync(
//         uri,
//         [{ resize: { width: 256, height: 256 } }],
//         { format: SaveFormat.JPEG, compress: 0.9 }
//       );
      
//       setImage(manipulatedImage.uri);
//       setPrediction(null);
//       setErrorDetails(null);
//       predictCattleHealth(manipulatedImage.uri);
      
//       // Scroll to results area when prediction starts
//       setTimeout(() => {
//         scrollViewRef.current?.scrollTo({ y: 100, animated: true });
//       }, 300);
      
//     } catch (error) {
//       console.error('Error processing image:', error);
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//       Alert.alert('Error', 'Failed to process image');
//     }
//   };

//   // Convert image to base64
//   const imageToBase64 = async (uri) => {
//     try {
//       const base64 = await FileSystem.readAsStringAsync(uri, {
//         encoding: FileSystem.EncodingType.Base64,
//       });
//       return base64;
//     } catch (error) {
//       console.error('Error converting image to base64:', error);
//       throw error;
//     }
//   };

//   // Call the cattle health prediction API
//   const predictCattleHealth = async (imageUri) => {
//     setLoading(true);
//     setErrorDetails(null);
    
//     try {
//       const formData = new FormData();
//       formData.append('file', {
//         uri: imageUri,
//         type: 'image/jpeg',
//         name: 'cattle_image.jpg',
//       });

//       const response = await fetch('https://disease-7gpg.onrender.com/predict', {
//         method: 'POST',
//         body: formData,
//         headers: {
//           'Content-Type': 'multipart/form-data',
//           'Accept': 'application/json',
//         },
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setPrediction(data);
//         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//         setLoading(false);
//       } else {
//         await predictWithBase64(imageUri);
//       }
//     } catch (error) {
//       console.error('Error with FormData approach:', error);
//       try {
//         await predictWithBase64(imageUri);
//       } catch (fallbackError) {
//         console.error('Both approaches failed:', fallbackError);
//         setErrorDetails('Server error. Please try again later.');
//         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//         Alert.alert('Error', 'Failed to analyze cattle health. Please try again later.');
//         setLoading(false);
//       }
//     }
//   };

//   // Fallback base64 approach
//   const predictWithBase64 = async (imageUri) => {
//     try {
//       const base64Image = await imageToBase64(imageUri);
//       const response = await fetch('https://disease-7gpg.onrender.com/predict', {
//         method: 'POST',
//         body: JSON.stringify({
//           image: base64Image,
//         }),
//         headers: {
//           'Content-Type': 'application/json',
//           'Accept': 'application/json',
//         },
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`API returned status ${response.status}: ${errorText}`);
//       }

//       const data = await response.json();
//       setPrediction(data);
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//     } catch (error) {
//       console.error('Error with base64 approach:', error);
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Reset and take a new photo
//   const resetAnalysis = () => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     setImage(null);
//     setPrediction(null);
//     setErrorDetails(null);
//   };

//   // Disease information
//   const getDiseaseInfo = () => {
//     if (!prediction) return { description: '', treatment: '', color: '', severity: '' };

//     switch (prediction.disease) {
//       case 'Healthy':
//         return {
//           description: 'Your cattle appears to be in excellent condition with no visible signs of disease.',
//           treatment: 'Continue regular health checks, vaccinations, and proper nutrition to maintain cattle health.',
//           color: '#4CAF50', // Green
//           severity: 'Good',
//         };
//       case 'Foot and Mouth Disease':
//         return {
//           description: 'Foot and Mouth Disease is a highly contagious viral disease causing fever and blisters.',
//           treatment: '1. Quarantine affected animals immediately.\n2. Contact a veterinarian for antiviral treatments.\n3. Disinfect equipment and premises.\n4. Vaccinate unaffected animals if advised.\n5. Follow local regulations for disease control.',
//           color: '#F44336', // Red
//           severity: 'Critical',
//         };
//       case 'Lumpy Skin Disease':
//         return {
//           description: 'Lumpy Skin Disease causes nodules on the skin, fever, and reduced milk production.',
//           treatment: '1. Consult a veterinarian for symptomatic treatment.\n2. Administer antibiotics for secondary infections.\n3. Vaccinate healthy animals.\n4. Isolate affected cattle.\n5. Maintain hygiene in the farm.',
//           color: '#FF9800', // Orange
//           severity: 'Warning',
//         };
//       default:
//         return {
//           description: 'Unknown condition detected. Further analysis is recommended.',
//           treatment: 'Consult a veterinarian for a detailed examination and advice.',
//           color: '#2196F3', // Blue
//           severity: 'Unknown',
//         };
//     }
//   };

//   // Render treatment steps as separate items
//   const renderTreatmentSteps = (treatment) => {
//     if (!treatment.includes('\n')) return <Text style={styles.treatmentText}>{treatment}</Text>;
    
//     return treatment.split('\n').map((step, index) => (
//       <View key={index} style={styles.treatmentStep}>
//         <Text style={styles.treatmentText}>{step}</Text>
//       </View>
//     ));
//   };

//   // Render prediction results
//   const renderResults = () => {
//     if (errorDetails) {
//       return (
//         <View style={styles.resultCard}>
//           <View style={styles.resultHeader}>
//             <Ionicons name="alert-circle" size={wp('8%')} color="#F44336" />
//             <Text style={[styles.predictionText, { color: '#F44336' }]}>Error</Text>
//           </View>
//           <Text style={styles.descriptionText}>{errorDetails}</Text>
//           <TouchableOpacity style={styles.retryButton} onPress={resetAnalysis}>
//             <Text style={styles.retryButtonText}>Try Again</Text>
//           </TouchableOpacity>
//         </View>
//       );
//     }

//     if (!prediction) return null;

//     const { description, treatment, color, severity } = getDiseaseInfo();

//     return (
//       <View style={styles.resultCard}>
//         <View style={styles.resultHeader}>
//           <View style={[styles.statusIndicator, { backgroundColor: color }]} />
//           <Text style={[styles.predictionText, { color }]}>{prediction.disease}</Text>
//         </View>
        
//         <View style={styles.confidenceContainer}>
//           <Text style={styles.confidenceLabel}>Analysis Confidence</Text>
//           <View style={styles.confidenceBarContainer}>
//             <View 
//               style={[
//                 styles.confidenceBar, 
//                 { width: `${prediction.confidence * 100}%`, backgroundColor: color }
//               ]} 
//             />
//           </View>
//           <Text style={styles.confidenceValue}>{(prediction.confidence * 100).toFixed(0)}%</Text>
//         </View>
        
//         <View style={styles.severityBadge} backgroundColor={color}>
//           <Text style={styles.severityText}>{severity}</Text>
//         </View>
        
//         <Text style={styles.sectionTitle}>Description</Text>
//         <Text style={styles.descriptionText}>{description}</Text>
        
//         <Text style={styles.sectionTitle}>Recommended Treatment</Text>
//         <View style={styles.treatmentContainer}>
//           {renderTreatmentSteps(treatment)}
//         </View>
        
//         <TouchableOpacity style={styles.newAnalysisButton} onPress={resetAnalysis}>
//           <Ionicons name="camera-outline" size={wp('5%')} color="#fff" />
//           <Text style={styles.newAnalysisButtonText}>New Analysis</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
//       <Header />
//       <ScrollView 
//         ref={scrollViewRef}
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//       >
//         <View style={styles.content}>
//           <View style={styles.card}>
//             {!image ? (
//               <View style={styles.placeholderContainer}>
//                 <View style={styles.iconContainer}>
//                   <Ionicons name="paw-outline" size={wp('18%')} color="#6A994E" />
//                 </View>
//                 <Text style={styles.title}>Cattle Health Analysis</Text>
//                 <Text style={styles.subtitle}>Take or select a photo of your cattle for health assessment</Text>
//               </View>
//             ) : (
//               <View style={styles.imageWrapper}>
//                 <Image source={{ uri: image }} style={styles.image} />
//                 {loading && (
//                   <View style={styles.loadingOverlay}>
//                     <LottieView
//                       source={require('../assets/lottie/loading.json')} // You'll need to add this animation
//                       autoPlay
//                       loop
//                       style={styles.loadingAnimation}
//                     />
//                     <Text style={styles.loadingText}>Analyzing cattle health...</Text>
//                   </View>
//                 )}
//               </View>
//             )}
//           </View>
  
//           {renderResults()}
  
//           <View style={styles.buttonContainer}>
//             <TouchableOpacity
//               style={[styles.cameraButton, loading && styles.disabledButton]}
//               onPress={takePhoto}
//               disabled={loading}
//               activeOpacity={0.8}
//             >
//               <Ionicons name="camera-outline" size={wp('6%')} color="#fff" />
//               <Text style={styles.buttonText}>Camera</Text>
//             </TouchableOpacity>
  
//             <TouchableOpacity
//               style={[styles.galleryButton, loading && styles.disabledButton]}
//               onPress={pickImage}
//               disabled={loading}
//               activeOpacity={0.8}
//             >
//               <Ionicons name="images-outline" size={wp('6%')} color="#fff" />
//               <Text style={styles.buttonText}>Gallery</Text>
//             </TouchableOpacity>
//           </View>
          
//           <Text style={styles.footerText}>
//             This analysis is an initial assessment only. Always consult with a professional veterinarian.
//           </Text>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F9FAFB',
//   },
//   scrollContent: {
//     flexGrow: 1,
//     paddingBottom: hp('5%'),
//   },
//   content: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: wp('5%'),
//     paddingTop: hp('2%'),
//   },
//   title: {
//     fontSize: wp('6%'),
//     fontWeight: '700',
//     color: '#333',
//     marginBottom: hp('1%'),
//     textAlign: 'center',
//   },
//   iconContainer: {
//     width: wp('25%'),
//     height: wp('25%'),
//     borderRadius: wp('12.5%'),
//     backgroundColor: 'rgba(106, 153, 78, 0.1)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: hp('2%'),
//   },
//   loadingAnimation: {
//     width: wp('20%'),
//     height: wp('20%'),
//   },
//   imageWrapper: {
//     width: '100%',
//     height: wp('80%'),
//     borderRadius: 16,
//     overflow: 'hidden',
//     marginVertical: hp('2%'),
//     position: 'relative',
//     // Shadow
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   image: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 16,
//   },
//   loadingOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 16,
//   },
//   loadingText: {
//     color: '#fff',
//     marginTop: hp('1%'),
//     fontSize: wp('4%'),
//     fontWeight: '500',
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     marginTop: hp('3%'),
//     marginBottom: hp('2%'),
//   },
//   cameraButton: {
//     backgroundColor: '#6A994E',
//     paddingVertical: hp('2%'),
//     paddingHorizontal: wp('2%'),
//     borderRadius: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     flex: 1,
//     marginRight: wp('2%'),
//     // Shadow
//     shadowColor: '#6A994E',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.3,
//     shadowRadius: 5,
//     elevation: 3,
//   },
//   galleryButton: {
//     backgroundColor: '#4CAF50',
//     paddingVertical: hp('2%'),
//     paddingHorizontal: wp('2%'),
//     borderRadius: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     flex: 1,
//     marginLeft: wp('2%'),
//     // Shadow
//     shadowColor: '#4CAF50',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.3,
//     shadowRadius: 5,
//     elevation: 3,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: wp('4%'),
//     fontWeight: '600',
//     marginLeft: wp('2%'),
//   },
//   disabledButton: {
//     opacity: 0.6,
//   },
//   resultCard: {
//     width: '100%',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: wp('5%'),
//     marginTop: hp('3%'),
//     // Shadow
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 6,
//     elevation: 4,
//   },
//   resultHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: hp('2%'),
//   },
//   statusIndicator: {
//     width: wp('2%'),
//     height: hp('6%'),
//     borderRadius: 4,
//     marginRight: wp('3%'),
//   },
//   predictionText: {
//     fontSize: wp('6%'),
//     fontWeight: '700',
//   },
//   confidenceContainer: {
//     marginVertical: hp('2%'),
//     width: '100%',
//   },
//   confidenceLabel: {
//     fontSize: wp('3.5%'),
//     color: '#666',
//     marginBottom: hp('0.5%'),
//   },
//   confidenceBarContainer: {
//     height: hp('1.5%'),
//     backgroundColor: '#E0E0E0',
//     borderRadius: 10,
//     overflow: 'hidden',
//     width: '100%',
//     marginVertical: hp('0.5%'),
//   },
//   confidenceBar: {
//     height: '100%',
//     borderRadius: 10,
//   },
//   confidenceValue: {
//     fontSize: wp('3.5%'),
//     fontWeight: '600',
//     alignSelf: 'flex-end',
//   },
//   severityBadge: {
//     alignSelf: 'flex-start',
//     paddingHorizontal: wp('3%'),
//     paddingVertical: hp('0.5%'),
//     borderRadius: 20,
//     marginTop: hp('1%'),
//     marginBottom: hp('2%'),
//   },
//   severityText: {
//     color: '#FFF',
//     fontWeight: '600',
//     fontSize: wp('3.5%'),
//   },
//   sectionTitle: {
//     fontSize: wp('4.5%'),
//     fontWeight: '700',
//     color: '#333',
//     marginTop: hp('2%'),
//     marginBottom: hp('1%'),
//     alignSelf: 'flex-start',
//   },
//   descriptionText: {
//     fontSize: wp('4%'),
//     color: '#555',
//     lineHeight: wp('6%'),
//     marginBottom: hp('1%'),
//   },
//   treatmentContainer: {
//     width: '100%',
//   },
//   treatmentStep: {
//     paddingVertical: hp('1%'),
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEEEEE',
//   },
//   treatmentText: {
//     fontSize: wp('4%'),
//     color: '#555',
//     lineHeight: wp('6%'),
//   },
//   newAnalysisButton: {
//     backgroundColor: '#6A994E',
//     paddingVertical: hp('1.5%'),
//     paddingHorizontal: wp('5%'),
//     borderRadius: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     alignSelf: 'center',
//     marginTop: hp('3%'),
//     // Shadow
//     shadowColor: '#6A994E',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   newAnalysisButtonText: {
//     color: '#fff',
//     fontSize: wp('4%'),
//     fontWeight: '600',
//     marginLeft: wp('2%'),
//   },
//   placeholderContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: wp('5%'),
//   },
//   subtitle: {
//     fontSize: wp('4%'),
//     color: '#666',
//     textAlign: 'center',
//     marginTop: hp('1%'),
//   },
//   card: {
//     width: '100%',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: wp('4%'),
//     alignItems: 'center',
//     // Shadow
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   retryButton: {
//     backgroundColor: '#F44336',
//     paddingVertical: hp('1.5%'),
//     paddingHorizontal: wp('5%'),
//     borderRadius: 12,
//     alignSelf: 'center',
//     marginTop: hp('2%'),
//     // Shadow
//     shadowColor: '#F44336',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   retryButtonText: {
//     color: '#fff',
//     fontSize: wp('4%'),
//     fontWeight: '600',
//   },
//   footerText: {
//     color: '#888',
//     fontSize: wp('3%'),
//     textAlign: 'center',
//     marginTop: hp('2%'),
//     fontStyle: 'italic',
//   },
// });



import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import LottieView from 'lottie-react-native';
import Header from '@/components/Header';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function CattlePrediction() {
  const [image, setImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const scrollViewRef = useRef(null);

 
  // Request camera/media library permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required', 
        'Please grant camera roll permissions to use this feature',
        [{ text: 'OK', onPress: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error) }]
      );
      return false;
    }
    return true;
  };

  // Pick an image from the gallery
  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Take a photo with the camera
  const takePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required', 
        'Please grant camera permissions to use this feature',
        [{ text: 'OK', onPress: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error) }]
      );
      return;
    }
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      
      if (!result.canceled) {
        processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Process image - resize to 256x256
  const processImage = async (uri) => {
    try {
      const manipulatedImage = await manipulateAsync(
        uri,
        [{ resize: { width: 256, height: 256 } }],
        { format: SaveFormat.JPEG, compress: 0.9 }
      );
      
      setImage(manipulatedImage.uri);
      setPrediction(null);
      setErrorDetails(null);
      predictCattleHealth(manipulatedImage.uri);
      
      // Scroll to results area when prediction starts
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 100, animated: true });
      }, 300);
      
    } catch (error) {
      console.error('Error processing image:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to process image');
    }
  };

  // Convert image to base64
  const imageToBase64 = async (uri) => {
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

  // Call the cattle health prediction API
  const predictCattleHealth = async (imageUri) => {
    setLoading(true);
    setErrorDetails(null);
    
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'cattle_image.jpg',
      });

      const response = await fetch('https://disease-7gpg.onrender.com/predict', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPrediction(data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setLoading(false);
      } else {
        await predictWithBase64(imageUri);
      }
    } catch (error) {
      console.error('Error with FormData approach:', error);
      try {
        await predictWithBase64(imageUri);
      } catch (fallbackError) {
        console.error('Both approaches failed:', fallbackError);
        setErrorDetails('Server error. Please try again later.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', 'Failed to analyze cattle health. Please try again later.');
        setLoading(false);
      }
    }
  };

  // Fallback base64 approach
  const predictWithBase64 = async (imageUri) => {
    try {
      const base64Image = await imageToBase64(imageUri);
      const response = await fetch('https://disease-7gpg.onrender.com/predict', {
        method: 'POST',
        body: JSON.stringify({
          image: base64Image,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API returned status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setPrediction(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error with base64 approach:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Reset and take a new photo
  const resetAnalysis = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImage(null);
    setPrediction(null);
    setErrorDetails(null);
  };

  // Disease information
  const getDiseaseInfo = () => {
    if (!prediction) return { description: '', treatment: '', color: '', severity: '' };

    switch (prediction.disease) {
      case 'Healthy':
        return {
          description: 'Your cattle appears to be in excellent condition with no visible signs of disease.',
          treatment: 'Continue regular health checks, vaccinations, and proper nutrition to maintain cattle health.',
          color: '#4CAF50', // Green
          severity: 'Good',
        };
      case 'Foot and Mouth Disease':
        return {
          description: 'Foot and Mouth Disease is a highly contagious viral disease causing fever and blisters.',
          treatment: '1. Quarantine affected animals immediately.\n2. Contact a veterinarian for antiviral treatments.\n3. Disinfect equipment and premises.\n4. Vaccinate unaffected animals if advised.\n5. Follow local regulations for disease control.',
          color: '#F44336', // Red
          severity: 'Critical',
        };
      case 'Lumpy Skin Disease':
        return {
          description: 'Lumpy Skin Disease causes nodules on the skin, fever, and reduced milk production.',
          treatment: '1. Consult a veterinarian for symptomatic treatment.\n2. Administer antibiotics for secondary infections.\n3. Vaccinate healthy animals.\n4. Isolate affected cattle.\n5. Maintain hygiene in the farm.',
          color: '#FF9800', // Orange
          severity: 'Warning',
        };
      default:
        return {
          description: 'Unknown condition detected. Further analysis is recommended.',
          treatment: 'Consult a veterinarian for a detailed examination and advice.',
          color: '#2196F3', // Blue
          severity: 'Unknown',
        };
    }
  };

  // Render treatment steps as separate items
  const renderTreatmentSteps = (treatment) => {
    if (!treatment.includes('\n')) return <Text style={styles.treatmentText}>{treatment}</Text>;
    
    return treatment.split('\n').map((step, index) => (
      <View key={index} style={styles.treatmentStep}>
        <Text style={styles.treatmentText}>{step}</Text>
      </View>
    ));
  };

  const renderResults = () => {
    if (errorDetails) {
      return (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Ionicons name="alert-circle" size={wp('8%')} color="#F44336" />
            <Text style={[styles.predictionText, { color: '#F44336' }]}>Error</Text>
          </View>
          <Text style={styles.descriptionText}>{errorDetails}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={resetAnalysis}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!prediction) return null;

    const { description, treatment, color, severity } = getDiseaseInfo();

    return (
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <View style={[styles.statusIndicator, { backgroundColor: color }]} />
          <Text style={[styles.predictionText, { color }]}>{prediction.disease}</Text>
        </View>
        
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceLabel}>Analysis Confidence</Text>
          <View style={styles.confidenceBarContainer}>
            <View 
              style={[
                styles.confidenceBar, 
                { width: `${prediction.confidence * 100}%`, backgroundColor: color }
              ]} 
            />
          </View>
          <Text style={styles.confidenceValue}>{(prediction.confidence * 100).toFixed(0)}%</Text>
        </View>
        
        <View style={styles.severityBadge} backgroundColor={color}>
          <Text style={styles.severityText}>{severity}</Text>
        </View>
        
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.descriptionText}>{description}</Text>
        
        <Text style={styles.sectionTitle}>Recommended Treatment</Text>
        <View style={styles.treatmentContainer}>
          {renderTreatmentSteps(treatment)}
        </View>
        
        <TouchableOpacity style={styles.newAnalysisButton} onPress={resetAnalysis}>
          <Ionicons name="camera-outline" size={wp('5%')} color="#fff" />
          <Text style={styles.newAnalysisButtonText}>New Analysis</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.insuranceButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert(
              'Protect Your Cattle',
              'Would you like to explore insurance options to safeguard your cattle against health risks?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Learn More', onPress: () => console.log('Navigate to insurance screen or external link') },
              ]
            );
          }}
        >
          <Ionicons name="shield-checkmark-outline" size={wp('5%')} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.insuranceButtonText}>Buy Insurance</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Header />
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.card}>
            {!image ? (
              <View style={styles.placeholderContainer}>
                <View style={styles.iconContainer}>
                  <Ionicons name="paw-outline" size={wp('18%')} color="#6A994E" />
                </View>
                <Text style={styles.title}>Cattle Health Analysis</Text>
                <Text style={styles.subtitle}>Take or select a photo of your cattle for health assessment</Text>
              </View>
            ) : (
              <View style={styles.imageWrapper}>
                <Image source={{ uri: image }} style={styles.image} />
                {loading && (
                  <View style={styles.loadingOverlay}>
                    <LottieView
                      source={require('../assets/lottie/loading.json')}
                      autoPlay
                      loop
                      style={styles.loadingAnimation}
                    />
                    <Text style={styles.loadingText}>Analyzing cattle health...</Text>
                  </View>
                )}
              </View>
            )}
          </View>
  
          {renderResults()}
  
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.cameraButton, loading && styles.disabledButton]}
              onPress={takePhoto}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={wp('6%')} color="#fff" />
              <Text style={styles.buttonText}>Camera</Text>
            </TouchableOpacity>
  
            <TouchableOpacity
              style={[styles.galleryButton, loading && styles.disabledButton]}
              onPress={pickImage}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons name="images-outline" size={wp('6%')} color="#fff" />
              <Text style={styles.buttonText}>Gallery</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.footerText}>
            This analysis is an initial assessment only. Always consult with a professional veterinarian.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp('5%'),
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
  },
  title: {
    fontSize: wp('6%'),
    fontWeight: '700',
    color: '#333',
    marginBottom: hp('1%'),
    textAlign: 'center',
  },
  iconContainer: {
    width: wp('25%'),
    height: wp('25%'),
    borderRadius: wp('12.5%'),
    backgroundColor: 'rgba(106, 153, 78, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  loadingAnimation: {
    width: wp('20%'),
    height: wp('20%'),
  },
  imageWrapper: {
    width: '100%',
    height: wp('80%'),
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: hp('2%'),
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  loadingText: {
    color: '#fff',
    marginTop: hp('1%'),
    fontSize: wp('4%'),
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: hp('3%'),
    marginBottom: hp('2%'),
  },
  cameraButton: {
    backgroundColor: '#6A994E',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('2%'),
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: wp('2%'),
    shadowColor: '#6A994E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  galleryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('2%'),
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: wp('2%'),
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: '600',
    marginLeft: wp('2%'),
  },
  disabledButton: {
    opacity: 0.6,
  },
  resultCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: wp('5%'),
    marginTop: hp('3%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  statusIndicator: {
    width: wp('2%'),
    height: hp('6%'),
    borderRadius: 4,
    marginRight: wp('3%'),
  },
  predictionText: {
    fontSize: wp('6%'),
    fontWeight: '700',
  },
  confidenceContainer: {
    marginVertical: hp('2%'),
    width: '100%',
  },
  confidenceLabel: {
    fontSize: wp('3.5%'),
    color: '#666',
    marginBottom: hp('0.5%'),
  },
  confidenceBarContainer: {
    height: hp('1.5%'),
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
    width: '100%',
    marginVertical: hp('0.5%'),
  },
  confidenceBar: {
    height: '100%',
    borderRadius: 10,
  },
  confidenceValue: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    alignSelf: 'flex-end',
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    borderRadius: 20,
    marginTop: hp('1%'),
    marginBottom: hp('2%'),
  },
  severityText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: wp('3.5%'),
  },
  sectionTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#333',
    marginTop: hp('2%'),
    marginBottom: hp('1%'),
    alignSelf: 'flex-start',
  },
  descriptionText: {
    fontSize: wp('4%'),
    color: '#555',
    lineHeight: wp('6%'),
    marginBottom: hp('1%'),
  },
  treatmentContainer: {
    width: '100%',
  },
  treatmentStep: {
    paddingVertical: hp('1%'),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  treatmentText: {
    fontSize: wp('4%'),
    color: '#555',
    lineHeight: wp('6%'),
  },
  newAnalysisButton: {
    backgroundColor: '#6A994E',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('5%'),
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: hp('3%'),
    shadowColor: '#6A994E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  newAnalysisButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: '600',
    marginLeft: wp('2%'),
  },
  insuranceButton: {
    backgroundColor: '#2196F3',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('5%'),
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: hp('2%'),
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  insuranceButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: '600',
    marginLeft: wp('2%'),
  },
  buttonIcon: {
    marginRight: wp('1%'),
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp('5%'),
  },
  subtitle: {
    fontSize: wp('4%'),
    color: '#666',
    textAlign: 'center',
    marginTop: hp('1%'),
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: wp('4%'),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  retryButton: {
    backgroundColor: '#F44336',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('5%'),
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: hp('2%'),
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: '600',
  },
  footerText: {
    color: '#888',
    fontSize: wp('3%'),
    textAlign: 'center',
    marginTop: hp('2%'),
    fontStyle: 'italic',
  },
});