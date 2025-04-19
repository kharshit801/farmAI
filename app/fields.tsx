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
  ActivityIndicator 
} from 'react-native';
import MapView, { Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { Router, useRouter } from 'expo-router';

// Import types
import { Field, NewField, Coordinate, MapRegion } from '../components/type';
import  { useField } from '../context/fieldcontext'

// Import utility files
import { loadFields, saveField } from '../components/utils/fieldStorage';
import { 
  mockFetchCropSuggestions, 
  calculateArea, 
  calculateCenter 
} from '../components/cropService';

const Fields: React.FC = () => {
  const { setSelectedField } = useField();

  const router=useRouter();
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
        
        if (storedFields.length > 0) {
          // Add image property to fields loaded from storage
          const fieldsWithImages = storedFields.map(field => ({
            ...field,
            image: require('../assets/images/fieldimage.jpg'), // Default image
          })) as Field[];
          
          setFields(fieldsWithImages);
        } else {
          // Set default field if no stored fields
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
        }
      } catch (error) {
        console.error("Error loading fields:", error);
        // Set default field on error
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

  const completePolygon = async () => {
    if (selectedPolygon.length < 3) {
      alert('Please mark at least 3 points to create a field boundary');
      return;
    }
    
    // Calculate area and get location from coordinates
    const calculatedArea = calculateArea(selectedPolygon);
    
    // Get location name from coordinates (normally would use reverse geocoding)
    let locationName = 'Unknown Location';
    
    // For demo purposes, we'll just use a placeholder
    if (currentLocation) {
      locationName = 'Near Current Location';
    }
    
    // Calculate center point of polygon for crop suggestions
    const centerPoint = calculateCenter(selectedPolygon);
    setIsFetchingSuggestions(true);
    
    // Fetch crop suggestions based on field location
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
        <Text style={styles.areaText}>{item.area} Acre</Text>
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
            <Text style={styles.suggestionsTitle}>Suggested crops:</Text>
            <View style={styles.cropTagsContainer}>
              {item.suggestedCrops.slice(0, 3).map((crop, index) => (
                <View key={index} style={styles.cropTag}>
                  <Text style={styles.cropTagText}>{crop}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Updated Manage Field button */}
        <TouchableOpacity 
          style={styles.manageFieldButton}
          onPress={() => {
            // Set the selected field in context before navigation
            setSelectedField(item);
            router.push('/managefield');
          }}
        >
          <Text style={styles.manageFieldButtonText}>Manage Field</Text>
          <MaterialIcons name="chevron-right" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  )
  const renderPageIndicator = () => {
    const totalPages = Math.ceil(fields.length / 1); // 1 field per page
    
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
            </MapView>
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
              style={styles.mapButton}
              onPress={resetMap}
            >
              <Text style={styles.mapButtonText}>Reset</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.mapButton, selectedPolygon.length >= 3 && styles.mapButtonComplete]}
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
            <Text style={styles.calculatedText}>{newField.area} Acres</Text>
            
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
                <View style={styles.cropTagsContainer}>
                  {newField.suggestedCrops.map((crop, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={[
                        styles.cropTag, 
                        newField.crop === crop && styles.cropTagSelected
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
                  ))}
                </View>
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
    height: 300, // Increased height for suggestions
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
  fieldInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    marginTop: 6,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 4,
  },
  cropTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cropTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  cropTagSelected: {
    backgroundColor: '#0055FF',
  },
  cropTagText: {
    fontSize: 12,
    color: '#555',
  },
  cropTagTextSelected: {
    color: 'white',
  },
  addFieldContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  addFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0055FF',
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
  map: {
    flex: 1,
  },
  mapControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  mapButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  mapButtonActive: {
    backgroundColor: '#0055FF',
  },
  mapButtonComplete: {
    backgroundColor: '#28a745',
  },
  mapButtonText: {
    fontSize: 14,
    color: '#333',
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
    backgroundColor: '#0055FF',
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