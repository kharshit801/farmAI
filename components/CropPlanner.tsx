import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StyleSheet,
  ImageBackground,
  FlatList,
} from 'react-native';
import * as Location from 'expo-location';
import LottieView from 'lottie-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Colors from '../constants/Colors';

// Mock map image
const MOCK_MAP_IMAGE = require('../assets/images/logoFarmAI.png');

// Crop suggestions
const CROP_SUGGESTIONS = [
  { name: 'Potato', icon: require('../assets/images/potato.png') },
  { name: 'Tomato', icon: require('../assets/images/tomato.png') },
  { name: 'Sugar Cane', icon: require('../assets/images/sugar-cane.png') },
  { name: 'Tea', icon: require('../assets/images/tea.png') },
];

// Calculate area in acres (simplified)
const calculateAreaInAcres = (points: { x: number; y: number }[]) => {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  area = Math.abs(area) / 2;
  return (area / 1000).toFixed(2);
};

// Mock LLM API call
const fetchCropPlan = async (location: { lat: number; lng: number }, crop: string, acres: string) => {
  const climate = location.lat > 0 ? 'Temperate' : 'Tropical';
  const season = new Date().getMonth() < 6 ? 'Spring' : 'Fall';
  try {
    return `🌱 **Optimal Plan for ${crop} on ${acres} acres in ${climate} climate during ${season}**:\n\n` +
           `- **Soil Preparation**: Test pH (ideal: 5.5–6.5). Add lime if acidic.\n` +
           `- **Planting**: Sow seeds at 2-inch depth, 12-inch spacing.\n` +
           `- **Irrigation**: 1 inch/week, adjust for rainfall.\n` +
           `- **Fertilizer**: Apply NPK 10-10-10 at planting, repeat mid-season.\n` +
           `- **Pest Control**: Monitor for aphids; use neem oil if detected.\n` +
           `- **Expected Yield**: ~20 tons/acre with proper care.\n\n` +
           `💡 **Tip**: Rotate crops annually to maintain soil health.`;
  } catch (error) {
    console.error('fetchCropPlan error:', error);
    return 'Error generating crop plan. Please try again.';
  }
};

const CropPlanner: React.FC = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [acres, setAcres] = useState<string>('');
  const [crop, setCrop] = useState<string>('');
  const [plan, setPlan] = useState<string>('');
  const [mapModalVisible, setMapModalVisible] = useState<boolean>(false);
  const [cropModalVisible, setCropModalVisible] = useState<boolean>(false);
  const [planModalVisible, setPlanModalVisible] = useState<boolean>(false);

  // Button animation
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location permission is required for geotagging.');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        console.log('Location fetched:', loc.coords);
        setLocation({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        });
      } catch (error) {
        console.error('Location error:', error);
        Alert.alert('Error', 'Failed to fetch location. Please ensure location services are enabled.');
      }
    })();
  }, []);

  const handleMapPress = (e: any) => {
    try {
      console.log('Map press event:', e.nativeEvent);
      if (points.length < 4) {
        const newPoint = {
          x: e.nativeEvent.locationX || 0,
          y: e.nativeEvent.locationY || 0,
        };
        setPoints([...points, newPoint]);
      } else {
        Alert.alert('Limit reached', 'Maximum 4 points allowed for farm boundary.');
      }
    } catch (error) {
      console.error('Map press error:', error);
      Alert.alert('Error', 'Failed to process map selection.');
    }
  };

  const confirmMapSelection = () => {
    try {
      if (points.length < 3) {
        Alert.alert('Invalid selection', 'Select at least 3 points to define the farm.');
        return;
      }
      const area = calculateAreaInAcres(points);
      setAcres(area);
      setMapModalVisible(false);
      setCropModalVisible(true);
    } catch (error) {
      console.error('Confirm map error:', error);
      Alert.alert('Error', 'Failed to process farm selection.');
    }
  };

  const selectCrop = (cropName: string) => {
    try {
      setCrop(cropName);
      setCropModalVisible(false);
      submitCrop();
    } catch (error) {
      console.error('Select crop error:', error);
      Alert.alert('Error', 'Failed to select crop.');
    }
  };

  const submitCrop = async () => {
    try {
      if (!crop) {
        Alert.alert('Input required', 'Please select or enter a crop type.');
        return;
      }
      if (location) {
        const plan = await fetchCropPlan(location, crop, acres);
        setPlan(plan);
        setPlanModalVisible(true);
      } else {
        Alert.alert('Error', 'Location data missing.');
      }
    } catch (error) {
      console.error('Submit crop error:', error);
      Alert.alert('Error', 'Failed to generate crop plan.');
    }
  };

  const renderCropItem = ({ item }: { item: { name: string; icon: any } }) => (
    <TouchableOpacity
      style={styles.cropItem}
      onPress={() => selectCrop(item.name)}
    >
      <ImageBackground source={item.icon} style={styles.cropIcon} />
      <Text style={styles.cropText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.plannerContainer}>
      <LottieView
        source={require('../assets/lottie/arrow.json')}
        autoPlay
        loop
        style={styles.lottie}
        onError={(error) => console.error('Lottie arrow error:', error)}
      />
      <Text style={styles.plannerTitle}>Plan Your Harvest</Text>
      <Text style={styles.plannerSubtitle}>
        Select your farm, choose a crop, and get a tailored plan for maximum yield.
      </Text>
      <Animated.View style={[animatedStyle]}>
        <TouchableOpacity
          style={styles.plannerButton}
          onPress={() => {
            try {
              console.log('Start Planning pressed, location:', location);
              scale.value = withSpring(0.95, {}, () => {
                scale.value = withSpring(1);
                if (!location) {
                  Alert.alert('Location unavailable', 'Please wait for location to load or enable location services.');
                  return;
                }
                setMapModalVisible(true);
              });
            } catch (error) {
              console.error('Start Planning error:', error);
              Alert.alert('Error', 'Failed to start planner.');
            }
          }}
        >
          <Text style={styles.plannerButtonText}>Start Planning</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Map Modal */}
      <Modal visible={mapModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Your Farm</Text>
          {location ? (
            <Text style={styles.modalSubtitle}>
              Location: Lat {location.lat.toFixed(4)}, Lng {location.lng.toFixed(4)}
            </Text>
          ) : (
            <Text style={styles.modalSubtitle}>Fetching location...</Text>
          )}
          <ImageBackground
            source={MOCK_MAP_IMAGE}
            style={styles.mockMap}
            onTouchEnd={handleMapPress}
            onError={(error) => console.error('ImageBackground error:', error)}
          >
            {points.map((point, index) => (
              <View
                key={index}
                style={[styles.mapPoint, { left: point.x, top: point.y }]}
              />
            ))}
          </ImageBackground>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: Colors.primary }]}
              onPress={confirmMapSelection}
            >
              <Text style={styles.modalButtonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: Colors.error }]}
              onPress={() => {
                setPoints([]);
                setMapModalVisible(false);
              }}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Crop Selection Modal */}
      <Modal visible={cropModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Choose Your Crop</Text>
          <Text style={styles.modalSubtitle}>Land Area: {acres} acres</Text>
          <FlatList
            data={CROP_SUGGESTIONS}
            renderItem={renderCropItem}
            keyExtractor={(item) => item.name}
            numColumns={2}
            style={styles.cropList}
          />
          <TextInput
            style={styles.input}
            placeholder="Or type a crop (e.g., Wheat)"
            value={crop}
            onChangeText={setCrop}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: Colors.primary }]}
              onPress={submitCrop}
            >
              <Text style={styles.modalButtonText}>Generate Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: Colors.error }]}
              onPress={() => setCropModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Plan Display Modal */}
      <Modal visible={planModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Your Crop Plan</Text>
          <LottieView
            source={require('../assets/lottie/document.json')}
            autoPlay
            loop
            style={styles.planLottie}
            onError={(error) => console.error('Lottie document error:', error)}
          />
          <ScrollView style={styles.planContainer}>
            <Text style={styles.planText}>{plan}</Text>
          </ScrollView>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: Colors.primary }]}
            onPress={() => setPlanModalVisible(false)}
          >
            <Text style={styles.modalButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default CropPlanner;

const styles = StyleSheet.create({
  plannerContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#E0F7E9',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  lottie: {
    width: 60,
    height: 60,
    alignSelf: 'center',
    marginBottom: 8,
  },
  plannerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A3C34',
    textAlign: 'center',
    marginBottom: 8,
  },
  plannerSubtitle: {
    fontSize: 16,
    color: '#4B5E5A',
    textAlign: 'center',
    marginBottom: 16,
  },
  plannerButton: {
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  plannerButtonText: {
    color: '#1f1f1f',
    fontSize: 18,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A3C34',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#4B5E5A',
    textAlign: 'center',
    marginBottom: 16,
  },
  mockMap: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mapPoint: {
    width: 12,
    height: 12,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'absolute',
  },
  cropList: {
    marginBottom: 16,
  },
  cropItem: {
    flex: 1,
    margin: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    elevation: 2,
  },
  cropIcon: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  cropText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A3C34',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    width: '40%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  planContainer: {
    flex: 1,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
  },
  planText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1A3C34',
  },
  planLottie: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: 16,
  },
});