import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Julep } from '@julep/sdk';


const JULEP_AGENT_ID = '06802005-adc9-75f1-8000-5ea756eb8532';
const JULEP_API_KEY = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTAxNTkwMTcsImlhdCI6MTc0NDk3NTAxNywic3ViIjoiNjVhMWE5MzYtYjBlMy01OTI0LTk3NzQtNjU1NDVmYmYwNTgyIn0.QbU03Bwv5Qv4Wv5sKuXu26wE9vac0lguHwKlUfzVeLvwVY1-UlMT7kr3h8K6XQEQJUn925NB5OD4uLR0jPHRAQ';

const julepCropTaskDefinition = {
  name: 'Crop Recommendations',
  description: 'Provide concise farming recommendations for a specific crop.',
  main: [
    {
      type: 'prompt',
      prompt: "$ f'You are an expert agronomist AI assistant. Provide concise and actionable farming recommendations specifically for growing {steps[0].input.cropName}. Focus on essential care, common issues, optimal conditions, and practical tips for maximizing yield. Keep the response relatively brief, ideally within 3-5 paragraphs. Do NOT include specific nutrient quantities (N, P, K) in this response; only focus on general recommendations.' ",
    },
  ],
};


const cropData = [
  {
    id: 'potato',
    name: 'Potato',
    image: require('../assets/images/potato.png'),

    nutrientsPerTree: { N: 400, P: 200, K: 400 },
  },
  {
    id: 'tomato',
    name: 'Tomato',
    image: require('../assets/images/tomato.png'),
    nutrientsPerTree: { N: 300, P: 150, K: 350 },
  },
  {
    id: 'sugarcane',
    name: 'Sugar Cane',
    image: require('../assets/images/sugar-cane.png'),
    nutrientsPerTree: { N: 500, P: 250, K: 450 },
  },
  {
    id: 'tea',
    name: 'Tea',
    image: require('../assets/images/tea.png'),
    nutrientsPerTree: { N: 200, P: 100, K: 300 },
  },
];


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


const FertilizerCalculatorScreen = () => {
  const router = useRouter();

  const [selectedCropId, setSelectedCropId] = useState(cropData[0].id);
  const [treeCount, setTreeCount] = useState('1');
  const [isCropModalVisible, setIsCropModalVisible] = useState(false);
  const [calculatedResults, setCalculatedResults] = useState<{ N: number; P: number; K: number } | null>(null);


  const [cropRecommendations, setCropRecommendations] = useState<string | null>(null);
  const [isJulepLoading, setIsJulepLoading] = useState(false);
  const [julepError, setJulepError] = useState<string | null>(null);
  const [hasRequestedTips, setHasRequestedTips] = useState(false);



  const currentCrop = useMemo(() => {
    return cropData.find(crop => crop.id === selectedCropId) || cropData[0];
  }, [selectedCropId]);



  const cropSelectorScale = useSharedValue(1);
  const decrementScale = useSharedValue(1);
  const incrementScale = useSharedValue(1);
  const calculateScale = useSharedValue(1);

  const getTipsScale = useSharedValue(1);



  const handlePressIn = (scale: Animated.SharedValue<number>) => {
    scale.value = withSpring(0.98);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = (scale: Animated.SharedValue<number>) => {
    scale.value = withSpring(1);
  };


  const cropSelectorAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cropSelectorScale.value }],
  }));

  const decrementAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: decrementScale.value }],
  }));

  const incrementAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: incrementScale.value }],
  }));

  const calculateAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: calculateScale.value }],
  }));

  const getTipsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: getTipsScale.value }],
  }));



  const decrementTrees = () => {
    const count = parseInt(treeCount, 10);
     if (!isNaN(count) && count > 1) {
        setTreeCount((count - 1).toString());
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCalculatedResults(null);
    } else if (isNaN(count) || count <= 0) {
         setTreeCount('1');
         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const incrementTrees = () => {
    const count = parseInt(treeCount, 10);
    if (!isNaN(count)) {
        setTreeCount((count + 1).toString());
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCalculatedResults(null);
    } else {
        setTreeCount('1');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };


  const handleTreeCountChange = (text: string) => {

    const numericText = text.replace(/[^0-9]/g, '');
    setTreeCount(numericText);
    setCalculatedResults(null);
  };



  const julepClient = useMemo(() => {
    if (!JULEP_API_KEY || JULEP_API_KEY === 'YOUR_JULEP_API_KEY') {
       console.warn("Julep API key is missing or placeholder. Julep recommendations will not work.");
       setJulepError("API key not configured. Julep recommendations unavailable.");
      return null;
    }
     if (!JULEP_AGENT_ID || JULEP_AGENT_ID === 'YOUR_JULEP_AGENT_ID') {
       console.warn("Julep Agent ID is missing or placeholder. Julep recommendations will not work.");
       setJulepError("Agent ID not configured. Julep recommendations unavailable.");
      return null;
    }
    return new Julep({ apiKey: JULEP_API_KEY });
  }, []);


  const fetchCropRecommendations = useCallback(async () => {
    if (!julepClient) {
      return;
    }

    if (!currentCrop) {
         setJulepError("Could not determine current crop for recommendations.");
         return;
    }

    setIsJulepLoading(true);
    setCropRecommendations(null);
    setJulepError(null);
    setHasRequestedTips(true);

    try {

      const task = await julepClient.tasks.create(JULEP_AGENT_ID, julepCropTaskDefinition);
      const execution = await julepClient.executions.create(task.id, {
        input: { cropName: currentCrop.name },
      });

      let result: JulepResult;
      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        result = await julepClient.executions.get(execution.id);
        if (result.status === 'succeeded') {
          const botText = result.output?.choices?.[0]?.message?.content || 'No recommendations available for this crop.';

          setCropRecommendations(botText);
          break;
        } else if (result.status === 'failed') {
          console.error("Julep Execution Failed:", result.error?.message);
          throw new Error(result.error?.message || 'Failed to get recommendations from AI.');
        }
         console.log(`Julep status: ${result.status}, attempt ${attempts + 1}/${maxAttempts}`);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      if (attempts >= maxAttempts) {
         console.warn("Julep polling timed out.");
        throw new Error('Recommendations are taking too long. Please try again later.');
      }

    } catch (error: any) {
      console.error('Error fetching Julep recommendations:', error);
      setJulepError(error.message || 'Failed to fetch recommendations.');
    } finally {
      setIsJulepLoading(false);
    }
  }, [julepClient, currentCrop]);



  const handleCalculate = () => {
    const count = parseInt(treeCount, 10);


    if (isNaN(count) || count <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid number of plants/trees (greater than 0).");
      setCalculatedResults(null);
      return;
    }

    if (!currentCrop) {
       Alert.alert("Error", "Could not find data for the selected crop.");
       setCalculatedResults(null);
       return;
    }

    const { nutrientsPerTree } = currentCrop;


    const totalN_g = nutrientsPerTree.N * count;
    const totalP_g = nutrientsPerTree.P * count;
    const totalK_g = nutrientsPerTree.K * count;


    const totalN_kg = totalN_g / 1000;
    const totalP_kg = totalP_g / 1000;
    const totalK_kg = totalK_g / 1000;


    setCalculatedResults({ N: totalN_kg, P: totalP_kg, K: totalK_kg });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };


  const renderCropItem = ({ item }: { item: typeof cropData[0] }) => (
    <TouchableOpacity
      style={styles.cropModalItem}
      onPress={() => {
        setSelectedCropId(item.id);
        setIsCropModalVisible(false);
        setCalculatedResults(null);
        setCropRecommendations(null);
        setJulepError(null);
        setHasRequestedTips(false);
      }}
    >
      <Image source={item.image} style={styles.cropModalItemImage} />
      <Text style={styles.cropModalItemText}>{item.name}</Text>
    </TouchableOpacity>
  );


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={wp('6%')} color="#1F1F1F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fertilizer Calculator</Text>
          <View style={styles.placeholderRight} />
        </View>

        {/* Illustration */}
        <View style={styles.illustration}>
          <Image
            source={currentCrop.image}
            style={styles.illustrationImage}
          />
        </View>

        {/* Crop Selector */}
        <View style={styles.contentSection}>
          <Text style={styles.infoText}>Select your crop</Text>
          <Animated.View style={[styles.cropSelectorWrapper, cropSelectorAnimatedStyle]}>
            <TouchableOpacity
              style={styles.cropSelector}
              onPress={() => setIsCropModalVisible(true)}
              onPressIn={() => handlePressIn(cropSelectorScale)}
              onPressOut={() => handlePressOut(cropSelectorScale)}
            >
              <View style={styles.cropSelectorContent}>
                <Image
                  source={currentCrop.image}
                  style={styles.cropIcon}
                />
                <Text style={styles.cropName}>{currentCrop.name}</Text>
              </View>
              <Ionicons name="chevron-down" size={wp('6%')} color="#1F1F1F" />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Nutrient Section */}
        <View style={styles.nutrientSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.numberBadge}>
              <Text style={styles.numberBadgeText}>1</Text>
            </View>
            <Text style={styles.sectionTitle}>Per Plant Nutrient Needs</Text>
            <TouchableOpacity style={styles.infoButton}>
              <Ionicons name="information-circle-outline" size={wp('6%')} color="#6A994E" />

            </TouchableOpacity>
          </View>

          <Text style={styles.nutrientDescription}>
            Recommended per plant/tree nutrient requirements for <Text style={{ fontWeight: 'bold' }}>{currentCrop.name}</Text> based on general guidelines:
          </Text>

          {/* Nutrient Cards */}
          <View style={styles.nutrientCardsContainer}>
            {[
              { label: 'N', value_g: currentCrop.nutrientsPerTree.N },
              { label: 'P', value_g: currentCrop.nutrientsPerTree.P },
              { label: 'K', value_g: currentCrop.nutrientsPerTree.K },
            ].map((nutrient, index) => (
              <View key={index} style={styles.nutrientCard}>
                <Text style={styles.nutrientLabel}>{nutrient.label}:</Text>

                <Text style={styles.nutrientValue}>{`${nutrient.value_g} g`}</Text>

                 <Text style={styles.nutrientPerTree}>{`(${(nutrient.value_g / 1000).toFixed(2)} kg)`}</Text>
              </View>
            ))}
          </View>
        </View>

         {/* Crop Recommendations Section */}
        <View style={styles.recommendationsSection}>
             <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                    <Text style={styles.numberBadgeText}>2</Text>
                </View>
                <Text style={styles.sectionTitle}>Crop Recommendations</Text>
             </View>


            {isJulepLoading ? (
                <View style={styles.recommendationsLoading}>
                    <ActivityIndicator size="small" color="#6A994E" />
                    <Text style={styles.recommendationsLoadingText}>Getting tips for {currentCrop.name}...</Text>
                </View>
            ) : julepError ? (
                <View style={styles.recommendationsError}>
                    <Ionicons name="warning-outline" size={wp('5%')} color="#F44336" />
                    <Text style={styles.recommendationsErrorText}>{julepError}</Text>
                </View>
            ) : cropRecommendations ? (
                 <View style={styles.recommendationsContent}>
                    <Text style={styles.recommendationsTextTitle}>Tips for {currentCrop.name}:</Text>
                    <Text style={styles.recommendationsText}>{cropRecommendations}</Text>
                 </View>
            ) : (

                <Animated.View style={[styles.getTipsButtonWrapper, getTipsAnimatedStyle]}>
                    <TouchableOpacity
                        style={styles.getTipsButton}
                        onPress={fetchCropRecommendations}
                        onPressIn={() => handlePressIn(getTipsScale)}
                        onPressOut={() => handlePressOut(getTipsScale)}

                        disabled={!julepClient || isJulepLoading}
                    >

                       <View style={[styles.buttonContent, (!julepClient || isJulepLoading) && styles.disabledButton, { backgroundColor: '#1F1F1F' }]}>
                            <Ionicons name="bulb-outline" size={wp('6%')} color="#fff" />
                            <Text style={styles.buttonText}>Get Recommendations for {currentCrop.name}</Text>
                       </View>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>


        {/* Tree Counter */}
        <View style={styles.treeCountSection}>
          <Text style={styles.treeCountLabel}>Number of Plants/Trees</Text>
          <View style={styles.treeCounter}>
            <Animated.View style={[styles.counterButtonWrapper, decrementAnimatedStyle]}>
              <TouchableOpacity

                style={{ borderRadius: wp('2%') }}
                onPress={decrementTrees}
                onPressIn={() => handlePressIn(decrementScale)}
                onPressOut={() => handlePressOut(decrementScale)}

                disabled={parseInt(treeCount, 10) <= 1 || isNaN(parseInt(treeCount, 10)) || parseInt(treeCount, 10) <= 0}
              >

                <View style={[styles.counterButton, { backgroundColor: '#1F1F1F' }]}>
                    <Text style={styles.counterButtonText}>−</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.treeCountInputContainer}>
              <TextInput
                style={styles.treeCountInput}
                value={treeCount}
                onChangeText={handleTreeCountChange}
                keyboardType="number-pad"
                textAlign="center"
                returnKeyType="done"
              />
              <Text style={styles.treeCountInputLabel}>Plants/Trees</Text>
            </View>

            <Animated.View style={[styles.counterButtonWrapper, incrementAnimatedStyle]}>
              <TouchableOpacity

                style={{ borderRadius: wp('2%') }}
                onPress={incrementTrees}
                onPressIn={() => handlePressIn(incrementScale)}
                onPressOut={() => handlePressOut(incrementScale)}
              >

                 <View style={[styles.counterButton, { backgroundColor: '#1F1F1F' }]}>
                    <Text style={styles.counterButtonText}>+</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Calculate Button */}
        <Animated.View style={[styles.calculateButtonWrapper, calculateAnimatedStyle]}>
          <TouchableOpacity

            style={{ borderRadius: wp('3%'), overflow: 'hidden' }}
            onPress={handleCalculate}
            onPressIn={() => handlePressIn(calculateScale)}
            onPressOut={() => handlePressOut(calculateScale)}
          >

             <View style={[styles.calculateButton, { backgroundColor: '#6A994E' }]}>
                <Text style={styles.calculateButtonText}>Calculate Total Fertilizer</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Display Calculation Results */}
        {calculatedResults && (
          <View style={styles.resultsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.numberBadge}>

                <Text style={styles.numberBadgeText}>3</Text>
              </View>
              <Text style={styles.sectionTitle}>Total Fertilizer Needed</Text>
            </View>
            <Text style={styles.resultsDescription}>
             For <Text style={{ fontWeight: 'bold' }}>{treeCount} {treeCount === '1' ? 'plant' : 'plants/trees'}</Text> of <Text style={{ fontWeight: 'bold' }}>{currentCrop.name}</Text>, you will need approximately:
            </Text>
            <View style={styles.totalResultsContainer}>
                <Text style={styles.totalResultText}>Nitrogen (N): <Text style={styles.totalResultValue}>{calculatedResults.N.toFixed(2)} kg</Text></Text>
                <Text style={styles.totalResultText}>Phosphorus (P): <Text style={styles.totalResultValue}>{calculatedResults.P.toFixed(2)} kg</Text></Text>
                <Text style={styles.totalResultText}>Potassium (K): <Text style={styles.totalResultValue}>{calculatedResults.K.toFixed(2)} kg</Text></Text>
            </View>
             <Text style={styles.disclaimerText}>
                Note: These are general recommendations. Actual needs may vary based on soil test results, specific varieties, climate, and farming practices.
            </Text>
          </View>
        )}

      </ScrollView>

      {/* Crop Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCropModalVisible}
        onRequestClose={() => {
          setIsCropModalVisible(!isCropModalVisible);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Crop</Text>
            <FlatList
              data={cropData}
              renderItem={renderCropItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalList}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsCropModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: hp('5%'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: wp('2%'),
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontWeight: '600',
    color: '#1F1F1F',
  },
  placeholderRight: {
    width: wp('10%'),
  },
  illustration: {
    alignItems: 'center',
    marginVertical: hp('2%'),
  },
  illustrationImage: {
    width: wp('60%'),
    height: wp('30%'),
    resizeMode: 'contain',
  },
  contentSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
  },
  infoText: {
    fontSize: wp('4%'),
    color: '#4B5563',
    marginBottom: hp('1%'),
  },
  cropSelectorWrapper: {
    borderRadius: wp('3%'),
  },
  cropSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp('3%'),
    padding: wp('3%'),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cropSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cropIcon: {
    width: wp('8%'),
    height: wp('8%'),
    marginRight: wp('2%'),
    resizeMode: 'contain',
  },
  cropName: {
    fontSize: wp('4.5%'),
    fontWeight: '500',
    color: '#1F1F1F',
  },
  nutrientSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  numberBadge: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: '#6A994E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  numberBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: wp('4%'),
  },
  sectionTitle: {
    fontSize: wp('5.5%'),
    fontWeight: '600',
    color: '#1F1F1F',
    flex: 1,
  },
  infoButton: {
    padding: wp('1%'),
  },
  nutrientDescription: {
    fontSize: wp('3.8%'),
    color: '#4B5563',
    marginBottom: hp('2%'),
    lineHeight: wp('5.5%'),
  },
  nutrientCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutrientCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp('3%'),
    padding: wp('3%'),
    width: wp('29%'),
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  nutrientLabel: {
    fontSize: wp('4%'),
    fontWeight: 'bold',
    color: '#6A994E',
    marginBottom: hp('0.5%'),
  },
  nutrientValue: {
    fontSize: wp('4.5%'),
    fontWeight: '500',
    color: '#1F1F1F',
    marginBottom: hp('0.5%'),
  },
  nutrientPerTree: {
    fontSize: wp('3%'),
    color: '#6B7280',
    textAlign: 'center',
  },
    recommendationsSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    marginTop: hp('1%'),
  },
   recommendationsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('2%'),
    backgroundColor: '#F9FAFB',
     borderRadius: wp('3%'),
     borderWidth: 1,
    borderColor: '#E5E7EB',
  },
   recommendationsLoadingText: {
    marginLeft: wp('3%'),
    fontSize: wp('4%'),
    color: '#4B5563',
  },
   recommendationsError: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    backgroundColor: '#FEE2E2',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
   recommendationsErrorText: {
    marginLeft: wp('3%'),
    fontSize: wp('4%'),
    color: '#B91C1C',
    flexShrink: 1,
  },
   recommendationsContent: {
     backgroundColor: '#F9FAFB',
     borderRadius: wp('3%'),
     borderWidth: 1,
     borderColor: '#E5E7EB',
     padding: wp('4%'),
   },
    recommendationsTextTitle: {
     fontSize: wp('4.5%'),
     fontWeight: '600',
     color: '#1F1F1F',
     marginBottom: hp('1%'),
   },
  recommendationsText: {
    fontSize: wp('3.8%'),
    color: '#4B5563',
    lineHeight: wp('5.5%'),
  },

  getTipsButtonWrapper: {
    marginTop: hp('2%'),
    borderRadius: wp('3%'),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
   getTipsButton: {

   },


  treeCountSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
     marginTop: hp('1%'),
  },
  treeCountLabel: {
    fontSize: wp('4.5%'),
    fontWeight: '500',
    color: '#1F1F1F',
    marginBottom: hp('1%'),
  },
  treeCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterButtonWrapper: {
    width: wp('15%'),
  },

  counterButton: {
    borderRadius: wp('2%'),
    justifyContent: 'center',
    alignItems: 'center',
    height: wp('12%'),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  counterButtonText: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  treeCountInputContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  treeCountInput: {
    backgroundColor: '#F9FAFB',
    width: wp('25%'),
    height: wp('12%'),
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: wp('4.5%'),
    fontWeight: '500',
    color: '#1F1F1F',
    textAlign: 'center',

  },
   treeCountInputLabel: {
    fontSize: wp('4%'),
    color: '#4B5563',
    marginLeft: wp('2%'),
  },
  calculateButtonWrapper: {
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
  },

  calculateButton: {
    borderRadius: wp('3%'),
    paddingVertical: hp('2%'),
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  calculateButtonText: {
    fontSize: wp('4.5%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },


  resultsSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#F9FAFB',
    marginTop: hp('2%'),
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
   resultsDescription: {
    fontSize: wp('3.8%'),
    color: '#4B5563',
    marginBottom: hp('1.5%'),
    lineHeight: wp('5.5%'),
  },
  totalResultsContainer: {

  },
  totalResultText: {
    fontSize: wp('4.2%'),
    color: '#1F1F1F',
    marginBottom: hp('1%'),
  },
  totalResultValue: {
    fontWeight: '600',
    color: '#6A994E',
  },
    disclaimerText: {
    fontSize: wp('3.2%'),
    color: '#6B7280',
    marginTop: hp('2%'),
    fontStyle: 'italic',
    textAlign: 'center',
  },



  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: wp('5%'),
    borderTopRightRadius: wp('5%'),
    paddingHorizontal: wp('6%'),
    paddingBottom: hp('3%'),
    maxHeight: hp('60%'),
  },
  modalTitle: {
    fontSize: wp('5.5%'),
    fontWeight: '600',
    color: '#1F1F1F',
    marginVertical: hp('2%'),
    textAlign: 'center',
  },
  modalList: {

  },
  cropModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cropModalItemImage: {
    width: wp('10%'),
    height: wp('10%'),
    marginRight: wp('4%'),
    resizeMode: 'contain',
  },
  cropModalItemText: {
    fontSize: wp('4.5%'),
    color: '#1F1F1F',
  },
  modalCloseButton: {
    marginTop: hp('2.5%'),
    backgroundColor: '#E5E7EB',
    borderRadius: wp('3%'),
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: wp('4.5%'),
    fontWeight: '500',
    color: '#1F1F1F',
  },


    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp('2%'),
        paddingHorizontal: wp('4%'),
    },
     disabledButton: {
        opacity: 0.6,
     },
     buttonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: wp('4.2%'),
        marginLeft: wp('2%'),
     }
});

export default FertilizerCalculatorScreen;