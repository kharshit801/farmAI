import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  Modal, 
  TextInput, 
  FlatList, 
  Dimensions, 
  SafeAreaView, 
  ActivityIndicator, 
  TextStyle 
} from 'react-native';
import MapView, { Polygon, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Import types
import { Field, NewField, Coordinate, MapRegion } from '../components/type';
import { useField } from '../context/fieldcontext';

// Import utility files
import { loadFields, saveField } from '../components/utils/fieldStorage';
import { 
  mockFetchCropSuggestions, 
  calculateArea, 
  calculateCenter 
} from '../components/cropService';

const Fields: React.FC = () => {
  const { setSelectedField } = useField();
  const router = useRouter();
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapModalVisible, setMapModalVisible] = useState(false);
  const [isFieldInfoModalVisible, setFieldInfoModalVisible] = useState(false);
  const [selectedPolygon, setSelectedPolygon] = useState<Coordinate[]>([]);
  const [currentLocation, setCurrentLocation] = useState<MapRegion | null>(null);
  const [isMarking, setIsMarking] = useState(false);
  const [newField, setNewField] = useState<NewField>({
    name: '',
    crop: '',
    area: 0,
    location: '',
    coordinates: [],
    suggestedCrops: [],
  });
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const screenWidth = Dimensions.get('window').width;

  // Load fields from AsyncStorage when component mounts
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const storedFields = await loadFields();
        console.log('Loaded fields from AsyncStorage:', storedFields); // Debug log
        if (storedFields.length > 0) {
          const fieldsWithImages = storedFields.map(field => ({
            ...field,
            image: require('../assets/images/fieldimage.jpg'),
          })) as Field[];
          setFields(fieldsWithImages);
        } else {
          setFields([
            {
              id: '1',
              name: 'My field',
              crop: 'Banana',
              area: 0.46,
              location: 'Prayagraj',
              coordinates: [
                { latitude: 25.4358, longitude: 81.8463 },
                { latitude: 25.4365, longitude: 81.8470 },
                { latitude: 25.4355, longitude: 81.8480 },
                { latitude: 25.4345, longitude: 81.8470 },
              ],
              image: require('../assets/images/fieldimage.jpg'),
              suggestedCrops: ['Banana', 'Rice', 'Wheat', 'Mustard'],
            },
          ]);
        }
      } catch (error) {
        console.error("Error loading fields:", error);
        setFields([
          {
            id: '1',
            name: 'My field',
            crop: 'Banana',
            area: 0.46,
            location: 'Prayagraj',
            coordinates: [
              { latitude: 25.4358, longitude: 81.8463 },
              { latitude: 25.4365, longitude: 81.8470 },
              { latitude: 25.4355, longitude: 81.8480 },
              { latitude: 25.4345, longitude: 81.8470 },
            ],
            image: require('../assets/images/fieldimage.jpg'),
            suggestedCrops: ['Banana', 'Rice', 'Wheat'],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFields();
  }, []);

  // Get user's current location
  useEffect(() => {
    const getLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission to access location was denied');
          return;
        }
        let location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      } catch (error) {
        console.error("Error getting location:", error);
      }
    };
    getLocation();
  }, []);

  const handleMapPress = (event: any) => {
    if (!isMarking) return;
    const { coordinate } = event.nativeEvent;
    setSelectedPolygon([...selectedPolygon, coordinate]);
  };

  const undoLastPoint = () => {
    setSelectedPolygon(selectedPolygon.slice(0, -1));
  };

  const completePolygon = async () => {
    if (selectedPolygon.length < 3) {
      alert('Please mark at least 3 points to create a field boundary');
      return;
    }
    const calculatedArea = calculateArea(selectedPolygon);
    let locationName = 'Unknown Location';
    if (currentLocation) {
      locationName = 'Near Current Location';
    }
    const centerPoint = calculateCenter(selectedPolygon);
    setIsFetchingSuggestions(true);
    const suggestedCrops = await mockFetchCropSuggestions(
      centerPoint.latitude, 
      centerPoint.longitude
    );
    setIsFetchingSuggestions(false);
    setNewField({
      ...newField,
      area: calculatedArea,
      location: locationName,
      coordinates: selectedPolygon,
      suggestedCrops: suggestedCrops,
    });
    setIsMarking(false);
    setMapModalVisible(false);
    setFieldInfoModalVisible(true);
  };

  const resetMap = () => {
    setSelectedPolygon([]);
    setIsMarking(true);
  };

  const handleSaveField = async () => {
    if (!newField.name || !newField.crop) {
      alert('Please enter field name and crop type');
      return;
    }
    const newFieldEntry: Field = {
      id: Date.now().toString(),
      name: newField.name,
      crop: newField.crop,
      area: newField.area,
      location: newField.location,
      coordinates: newField.coordinates,
      image: require('../assets/images/fieldimage.jpg'),
      suggestedCrops: newField.suggestedCrops,
    };
    try {
      const updatedFields = await saveField(newFieldEntry, fields);
      setFields(updatedFields);
      setFieldInfoModalVisible(false);
      setNewField({
        name: '',
        crop: '',
        area: 0,
        location: '',
        coordinates: [],
        suggestedCrops: [],
      });
    } catch (error) {
      console.error("Failed to save field:", error);
      alert('Failed to save field. Please try again.');
    }
  };

  const openMapModal = () => {
    setSelectedPolygon([]);
    setIsMarking(true);
    setMapModalVisible(true);
  };

  const renderField = ({ item }: { item: Field }) => (
    <View style={[styles.fieldCard, { width: screenWidth - 32 }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.fieldName}>{item.name}</Text>
        <Text style={styles.areaText}>{item.area.toFixed(2)} Acre</Text>
      </View>
      <View style={styles.imageContainer}>
        <Image 
          source={item.image} 
          style={styles.fieldImage}
          defaultSource={require('../assets/images/fieldimage.jpg')}
        />
        <View style={styles.imageOverlay}>
          <View style={styles.cropContainer}>
            <View style={styles.cropIconContainer}>
              <Text style={styles.cropEmoji}>
                {item.crop === 'Banana' ? '🍌' : '🌱'}
              </Text>
            </View>
            <Text style={styles.cropName}>{item.crop}</Text>
          </View>
        </View>
      </View>
      <View style={styles.fieldDetailsContainer}>
        <View style={styles.locationContainer}>
          <MaterialIcons name="location-on" size={16} color="#666" />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
        {item.suggestedCrops && item.suggestedCrops.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Suggested Crops:</Text>
            <FlatList
              data={item.suggestedCrops}
              renderItem={({ item: crop }) => (
                <View style={styles.cropTag}>
                  <Text style={styles.cropTagText}>{crop}</Text>
                </View>
              )}
              keyExtractor={(crop, index) => `${crop}-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cropTagsContainer}
            />
          </View>
        )}
        <TouchableOpacity 
          style={styles.manageFieldButton}
          onPress={() => {
            setSelectedField(item);
            router.push('/managefield');
          }}
        >
          <Text style={styles.manageFieldButtonText}>Manage Field</Text>
          <MaterialIcons name="chevron-right" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPageIndicator = () => {
    const totalPages = Math.ceil(fields.length / 1);
    return (
      <View style={styles.paginationContainer}>
        {Array.from({ length: totalPages }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentPage ? styles.paginationDotActive : {}
            ]}
          />
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0055FF" />
        <Text style={styles.loadingText}>Loading your fields...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Manage your fields</Text>
      <FlatList
        data={fields}
        renderItem={renderField}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        contentContainerStyle={styles.fieldsList}
        onMomentumScrollEnd={(event) => {
          const newPage = Math.floor(
            event.nativeEvent.contentOffset.x / 
            (screenWidth - 16)
          );
          setCurrentPage(newPage);
        }}
      />
      {renderPageIndicator()}
      <View style={styles.addFieldContainer}>
        <TouchableOpacity 
          style={styles.addFieldButton}
          onPress={openMapModal}
        >
          <Text style={styles.addFieldButtonText}>+</Text>
          <Text style={styles.addFieldText}>Add field</Text>
        </TouchableOpacity>
      </View>
      {/* Map Modal for selecting field boundaries */}
      <Modal
        visible={isMapModalVisible}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mark Your Field</Text>
            <TouchableOpacity 
              onPress={() => setMapModalVisible(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>
          {currentLocation ? (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={currentLocation}
                onPress={handleMapPress}
              >
                {selectedPolygon.length > 0 && (
                  <Polygon
                    coordinates={selectedPolygon}
                    strokeColor="#0055FF"
                    fillColor="rgba(0, 85, 255, 0.2)"
                    strokeWidth={2}
                  />
                )}
                {selectedPolygon.map((coord, index) => (
                  <Marker
                    key={index}
                    coordinate={coord}
                    title={`Point ${index + 1}`}
                    pinColor="#0055FF"
                  />
                ))}
              </MapView>
              <View style={styles.pointsCounter}>
                <Text style={styles.pointsCounterText}>
                  Points placed: {selectedPolygon.length}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <Text>Loading map...</Text>
            </View>
          )}
          <View style={styles.mapControlsContainer}>
            <TouchableOpacity 
              style={[styles.mapButton, isMarking && styles.mapButtonActive]}
              onPress={() => setIsMarking(!isMarking)}
            >
              <Text style={[styles.mapButtonText, isMarking && styles.activeButtonText]}>
                {isMarking ? 'Marking...' : 'Start Marking'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.mapButton, selectedPolygon.length === 0 && styles.mapButtonDisabled]}
              onPress={undoLastPoint}
              disabled={selectedPolygon.length === 0}
            >
              <Text style={styles.mapButtonText}>Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.mapButton}
              onPress={resetMap}
            >
              <Text style={styles.mapButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.mapButton, selectedPolygon.length >= 3 ? styles.mapButtonComplete : styles.mapButtonDisabled]}
              onPress={completePolygon}
              disabled={selectedPolygon.length < 3}
            >
              <Text style={[
                styles.mapButtonText, 
                selectedPolygon.length >= 3 && styles.completeButtonText
              ]}>
                Complete
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
      {/* Field Info Modal */}
      <Modal
        visible={isFieldInfoModalVisible}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Field Information</Text>
            <TouchableOpacity 
              onPress={() => setFieldInfoModalVisible(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>
          <View style={styles.fieldFormContainer}>
            <Text style={styles.formLabel}>Field Name</Text>
            <TextInput
              style={styles.input}
              value={newField.name}
              onChangeText={(text) => setNewField({...newField, name: text})}
              placeholder="Enter field name"
            />
            <Text style={styles.formLabel}>Crop Type</Text>
            <TextInput
              style={styles.input}
              value={newField.crop}
              onChangeText={(text) => setNewField({...newField, crop: text})}
              placeholder="Enter crop type"
            />
            <Text style={styles.formLabel}>Area (Calculated)</Text>
            <Text style={styles.calculatedText}>{newField.area.toFixed(2)} Acres</Text>
            <Text style={styles.formLabel}>Location</Text>
            <Text style={styles.calculatedText}>{newField.location}</Text>
            {isFetchingSuggestions ? (
              <View style={styles.suggestionsLoadingContainer}>
                <ActivityIndicator size="small" color="#0055FF" />
                <Text style={styles.suggestionsLoadingText}>Fetching crop suggestions...</Text>
              </View>
            ) : newField.suggestedCrops && newField.suggestedCrops.length > 0 ? (
              <View>
                <Text style={styles.formLabel}>Suggested Crops</Text>
                <FlatList
                  data={newField.suggestedCrops}
                  renderItem={({ item: crop }) => (
                    <TouchableOpacity 
                      style={[
                        styles.cropTag, 
                        newField.crop === crop && { borderColor: '#28a745', borderWidth: 1 }
                      ]}
                      onPress={() => setNewField({...newField, crop})}
                    >
                      <Text style={[
                        styles.cropTagText,
                        newField.crop === crop && styles.cropTagTextSelected
                      ]}>
                        {crop}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(crop, index) => `${crop}-${index}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cropTagsContainer}
                />
              </View>
            ) : null}
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveField}
            >
              <Text style={styles.saveButtonText}>Save Field</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f8fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  fieldsList: {
    paddingVertical: 8,
  },
  fieldCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 360,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cropContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  cropIconContainer: {
    marginRight: 8,
  },
  cropEmoji: {
    fontSize: 20,
  },
  cropName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  areaText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0055FF',
    backgroundColor: 'rgba(0, 85, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    zIndex: 10,
  },
  fieldImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fieldDetailsContainer: {
    marginTop: 4,
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  suggestionsContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  cropTagsContainer: {
    marginTop: 8,
    flexDirection: 'row',
    paddingVertical: 0,
    paddingRight: 24,
  },
  cropTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6f0fa',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    minWidth: 70,
  },
  cropTagText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  cropTagTextSelected: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '700',
  },
  addFieldContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  addFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6A994E',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addFieldButtonText: {
    fontSize: 20,
    color: 'white',
    marginRight: 8,
  },
  addFieldText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  pointsCounter: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 8,
  },
  pointsCounterText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  mapControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  mapButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  mapButtonActive: {
    backgroundColor: '#6A994E',
  },
  mapButtonComplete: {
    backgroundColor: '#28a745',
  },
  mapButtonDisabled: {
    backgroundColor: '#ccc',
  },
  mapButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  activeButtonText: {
    color: 'white',
  },
  completeButtonText: {
    color: 'white',
  },
  fieldFormContainer: {
    padding: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  calculatedText: {
    fontSize: 16,
    paddingVertical: 8,
    color: '#555',
  },
  suggestionsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  suggestionsLoadingText: {
    marginLeft: 12,
    color: '#555',
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#0055FF',
  },
  manageFieldButton: {
    backgroundColor: '#6A994E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  manageFieldButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 4,
  },
});

export default Fields;