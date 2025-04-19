import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
  SafeAreaView // Import SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import Header from "@/components/Header"; // Assuming your Header component is here

// Define the structure of a Mandi item from the API
interface Mandi {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety?: string; // Variety is sometimes null or 'NULL' in the data
  arrival_date: string;
  min_price: string; // API returns strings, potentially
  max_price: string; // API returns strings, potentially
  modal_price: string; // API returns strings, potentially
  // Add a property for calculated distance (optional, might not be available)
  distance?: number;
}

// --- MANDI CARD COMPONENT (Optimized with React.memo) ---
const MandiCard = React.memo(({ item }: { item: Mandi }) => {
  const cardBackgroundColor = useThemeColor({}, 'cardBackground') || '#fff';
  const textColor = useThemeColor({}, 'text') || '#000000';

   if (!item || typeof item.market !== 'string' || typeof item.commodity !== 'string') {
       console.warn("MandiCard received invalid item:", item);
       return null;
   }

  const minPrice = item.min_price?.toString() || 'N/A';
  const maxPrice = item.max_price?.toString() || 'N/A';
  const modalPrice = item.modal_price?.toString() || 'N/A';

  return (
    <View style={[styles.mandiCard, { backgroundColor: cardBackgroundColor }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.marketName, { color: textColor }]}>
          {item.market}
        </Text>

        {item.distance !== undefined && typeof item.distance === 'number' && isFinite(item.distance) && (
          <View style={styles.distanceContainer}>
            <Ionicons name="location-outline" size={16} color="#4CAF50" />
            <Text style={styles.distanceText}>{item.distance.toFixed(1)} km</Text>
          </View>
        )}
      </View>

      <View style={styles.infoRow}>
        <Text style={[styles.location, { color: textColor }]}>
          {item.district || 'Unknown District'}, {item.state || 'Unknown State'}
        </Text>
      </View>

      <View style={styles.commodityContainer}>
        <Text style={styles.commodityLabel}>Commodity:</Text>
        <Text style={[styles.commodityValue, { color: textColor }]}>
          {item.commodity} {item.variety && item.variety !== 'NULL' ? `(${item.variety})` : ''}
        </Text>
      </View>

      <View style={styles.priceContainer}>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>Min</Text>
          <Text style={[styles.priceValue, { color: textColor }]}>
            ₹{minPrice}
          </Text>
        </View>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>Max</Text>
          <Text style={[styles.priceValue, { color: textColor }]}>
            ₹{maxPrice}
          </Text>
        </View>
        <View style={[styles.priceItem, styles.modalPriceItem]}>
          <Text style={styles.modalPriceLabel}>Modal Price</Text>
          <Text style={[styles.modalPriceValue, { color: textColor }]}>
            ₹{modalPrice}
          </Text>
        </View>
      </View>

      <Text style={styles.dateText}>
        Updated: {item.arrival_date || 'Unknown date'}
      </Text>
    </View>
  );
});

const LOCATION_FETCH_TIMEOUT = 15000;
const GEOCODING_PROCESS_LIMIT = 100;
const API_DATA_LIMIT = 500;


export default function MandiScreen() {
  const [mandis, setMandis] = useState<Mandi[]>([]);
  const [filteredMandis, setFilteredMandis] = useState<Mandi[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('distance');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'granted' | 'denied' | 'failed'>('idle');


  const backgroundColor = useThemeColor({}, 'background') || '#ffffff';
  const textColor = useThemeColor({}, 'text') || '#000000';


  useEffect(() => {
    const getLocationAndFetchData = async () => {
      setLoading(true);
      setErrorMsg(null);
      setLocation(null);
      setLocationStatus('idle');

      try {
        console.log("Requesting location permission...");
        let { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          console.warn("Location permission denied.");
          setLocationStatus('denied');
          setErrorMsg('Permission to access location was denied. Cannot sort by distance.');
           Alert.alert(
            "Location Permission Denied",
            "To show nearest mandis, please grant location access in your device settings.",
            [
                { text: "OK", onPress: () => {} },
            ]
          );
          await fetchMandiData(null);
          return;
        }

        console.log("Location permission granted. Fetching location...");
        setLocationStatus('granted');

        try {
          const locationPromise = Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
          });

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Location request timed out')), LOCATION_FETCH_TIMEOUT)
          );

          let currentLocation = await Promise.race([locationPromise, timeoutPromise]) as Location.LocationObject;

          console.log("Location obtained:", currentLocation.coords);
          setLocation(currentLocation);
          setLocationStatus('granted');

          await fetchMandiData(currentLocation);

        } catch (locError: any) {
          console.error("Location fetch error:", locError);
          setLocationStatus('failed');
          let specificError = 'Could not get your precise location. Cannot sort by distance.';
          if (locError.message && locError.message.includes('timed out')) {
              specificError = 'Location request timed out. Cannot sort by distance.';
          } else if (locError.message) {
               specificError = `Location error: ${locError.message}. Cannot sort by distance.`;
          }
          setErrorMsg(specificError);
          await fetchMandiData(null);
        }

      } catch (overallError) {
        console.error("Overall setup error (permission/initial fetch):", overallError);
        setErrorMsg(`Failed to initialize: ${overallError instanceof Error ? overallError.message : 'Unknown error'}`);
        setLocationStatus('failed');
        await fetchMandiData(null).catch(err => {
             console.error("Fallback data fetch failed:", err);
             setMandis([]);
             setFilteredMandis([]);
        });
      } finally {
        setLoading(false);
      }
    };

    getLocationAndFetchData();

  }, []);


  const calculateDistance = (lat1: number | undefined, lon1: number | undefined, lat2: number | undefined, lon2: number | undefined): number => {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null ||
        typeof lat1 !== 'number' || typeof lon1 !== 'number' ||
        typeof lat2 !== 'number' || typeof lon2 !== 'number' ||
        !isFinite(lat1) || !isFinite(lon1) || !isFinite(lat2) || !isFinite(lon2)
    ) {
      return Infinity;
    }

    try {
      const R = 6371;
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c;
      return d;
    } catch (error) {
      console.error("Distance calculation error:", error);
      return Infinity;
    }
  };

  const deg2rad = (deg: number | undefined): number => {
     if (deg == null || typeof deg !== 'number' || !isFinite(deg)) {
         console.warn("Invalid degree value provided for deg2rad:", deg);
         return 0;
     }
    return deg * (Math.PI / 180);
  };


  const getCoordinates = async (placeName: string): Promise<{ latitude: number; longitude: number } | null> => {
    if (!placeName || typeof placeName !== 'string' || placeName.trim() === '') {
        console.warn("Invalid placeName provided for geocoding:", placeName);
        return null;
    }

    const query = placeName.includes("India") ? placeName : `${placeName}, India`;

    try {
      const geocodeResult = await Location.geocodeAsync(query);

      if (geocodeResult && geocodeResult.length > 0) {
        return { latitude: geocodeResult[0].latitude, longitude: geocodeResult[0].longitude };
      }
      console.warn("Geocoding returned no results for place:", placeName, "Result:", geocodeResult);
      return null;
    } catch (error) {
      console.error("Geocoding API error for place:", placeName, error);
      return null;
    }
  };


  const fetchMandiData = async (userLocation: Location.LocationObject | null) => {
    try {
      const apiKey = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b";
      const apiUrl = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=${API_DATA_LIMIT}`;

      console.log("Fetching data from API:", apiUrl);
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("API Error Response:", errorBody);
        throw new Error(`API responded with status: ${response.status}.`);
      }

      const data = await response.json();
      console.log("API Data fetched:", data?.records?.length, "records");

      if (data && data.records && Array.isArray(data.records)) {
        let mandiData: Mandi[] = data.records;
        const processedData: Mandi[] = [];
        const userCoords = userLocation?.coords;

        if (userCoords && userCoords.latitude != null && userCoords.longitude != null) {
           console.log("User location available. Processing for distance calculation...");
          const recordsToProcessCount = Math.min(mandiData.length, GEOCODING_PROCESS_LIMIT);

          for (let i = 0; i < recordsToProcessCount; i++) {
            const mandi = mandiData[i];
             if (!mandi || typeof mandi.market !== 'string' || typeof mandi.district !== 'string' || typeof mandi.state !== 'string') {
                 console.warn("Skipping incomplete mandi record:", mandi);
                 processedData.push(mandi);
                 continue;
             }

            try {
              const placeName = `${mandi.market}, ${mandi.district}, ${mandi.state}`;

              const coords = await getCoordinates(placeName);

              if (coords) {
                const distance = calculateDistance(
                  userCoords.latitude,
                  userCoords.longitude,
                  coords.latitude,
                  coords.longitude
                );
                if (isFinite(distance)) {
                   processedData.push({ ...mandi, distance: parseFloat(distance.toFixed(1)) });
                } else {
                   processedData.push(mandi);
                   console.warn("Distance calculation failed after geocoding for:", mandi);
                }
              } else {
                processedData.push(mandi);
                console.warn("Geocoding failed, adding item without distance:", mandi);
              }
            } catch (processingError) {
               console.error("Error processing mandi record during geocoding/distance:", mandi, processingError);
               processedData.push(mandi);
            }
          }

          for (let i = recordsToProcessCount; i < mandiData.length; i++) {
              if (mandiData[i]) {
                 processedData.push(mandiData[i]);
              }
          }

          setMandis(processedData);

        } else {
           console.log("User location not available or invalid. Adding data without distance calculation.");
          setMandis(mandiData.filter(item => item != null));
        }

      } else {
        console.warn("Invalid API response format or empty records:", data);
        setErrorMsg("Could not load mandi data due to unexpected API response.");
        setMandis([]);
      }
    } catch (error: any) {
      console.error("Error fetching or processing mandi data:", error);
      setErrorMsg(`Failed to load mandi data: ${error.message || 'Unknown error'}`);
      setMandis([]);
    } finally {
    }
  };

  useEffect(() => {
    if (mandis && mandis.length > 0) {
        console.log(`Sorting ${mandis.length} items by ${activeFilter}...`);
      let sorted = [...mandis];

      if (activeFilter === 'distance') {
        sorted.sort((a, b) => {
          const distA = (a?.distance != null && typeof a.distance === 'number' && isFinite(a.distance)) ? a.distance : Infinity;
          const distB = (b?.distance != null && typeof b.distance === 'number' && isFinite(b.distance)) ? b.distance : Infinity;
          return distA - distB;
        });
      } else if (activeFilter === 'price') {
        sorted.sort((a, b) => {
          const priceA = parseFloat(a?.modal_price?.toString() || '0') || 0;
          const priceB = parseFloat(b?.modal_price?.toString() || '0') || 0;
          return priceB - priceA;
        });
      }

      setFilteredMandis(sorted);
      console.log(`Sorting complete. Filtered list updated.`);

    } else {
        setFilteredMandis([]);
         console.log("Mandis list is empty, clearing filtered list.");
    }

  }, [activeFilter, mandis]);


  const renderItem = ({ item }: { item: Mandi }) => {
     return <MandiCard item={item} />;
  };

  const renderFilterButtons = () => {
      const isDistanceFilterEnabled = locationStatus === 'granted' && mandis.some(m => m.distance != null && isFinite(m.distance));
      const isPriceFilterEnabled = mandis.length > 0;

      if (loading || (mandis.length === 0 && !errorMsg)) {
          return null;
      }

      return (
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
                styles.filterButton,
                activeFilter === 'distance' && styles.activeFilter,
                !isDistanceFilterEnabled && styles.filterButtonDisabled,
            ]}
            onPress={() => setActiveFilter('distance')}
            disabled={!isDistanceFilterEnabled}
          >
            <Ionicons
              name={activeFilter === 'distance' && isDistanceFilterEnabled ? "location" : "location-outline"}
              size={16}
              color={activeFilter === 'distance' && isDistanceFilterEnabled ? '#fff' : (isDistanceFilterEnabled ? '#4CAF50' : '#999')}
            />
            <Text style={[
                styles.filterText,
                activeFilter === 'distance' && styles.activeFilterText,
                !isDistanceFilterEnabled && styles.filterTextDisabled
                ]}
            >
              Nearest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
                 styles.filterButton,
                 activeFilter === 'price' && styles.activeFilter,
                 !isPriceFilterEnabled && styles.filterButtonDisabled,
            ]}
            onPress={() => setActiveFilter('price')}
            disabled={!isPriceFilterEnabled}
          >
            <Ionicons
              name={activeFilter === 'price' && isPriceFilterEnabled ? "cash" : "cash-outline"}
              size={16}
              color={activeFilter === 'price' && isPriceFilterEnabled ? '#fff' : (isPriceFilterEnabled ? '#4CAF50' : '#999')}
            />
            <Text style={[
                styles.filterText,
                activeFilter === 'price' && styles.activeFilterText,
                 !isPriceFilterEnabled && styles.filterTextDisabled
                ]}
            >
              Best Price
            </Text>
          </TouchableOpacity>
        </View>
      );
  };


  return (
    // Wrap the main content in SafeAreaView
    // The style flex: 1 on the inner View makes it take up the remaining space
    <SafeAreaView style={[styles.safeAreaContainer, { backgroundColor }]}>
      <StatusBar style="auto" />

      {/* Header component, likely handles its own padding */}
      <Header />

      {/* Page Title */}
      <Text style={[styles.pageTitle, { color: textColor }]}>Nearby Mandis</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={[styles.loadingText, { color: textColor }]}>
            {locationStatus === 'idle' ? "Getting location and data..." :
             locationStatus === 'granted' ? "Fetching data and calculating distances..." :
             "Fetching data (location unavailable)..."}
          </Text>
           {errorMsg && <Text style={[styles.loadingText, { color: '#D32F2F', fontSize: 14, marginTop: 10 }]}>{errorMsg}</Text>}
        </View>
      ) : (
        <>
          {renderFilterButtons()}

          {errorMsg && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={24} color="#FF6B6B" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <FlatList
            data={filteredMandis}
            renderItem={renderItem}
            keyExtractor={(item, index) =>
                `${item?.market || ''}-${item?.commodity || ''}-${item?.modal_price || ''}-${item?.arrival_date || ''}-${index}`
            }
            contentContainerStyle={styles.listContainer}
             getItemLayout={(data, index) => (
                {length: 170, offset: 170 * index, index}
             )}
             initialNumToRender={10}
             maxToRenderPerBatch={10}
             windowSize={21}
             removeClippedSubviews={true}

            ListEmptyComponent={
                !loading && filteredMandis.length === 0 && !errorMsg ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="leaf-outline" size={64} color="#CCCCCC" />
                    <Text style={[styles.emptyText, { color: textColor }]}>
                       {mandis.length > 0 ?
                          "No mandis found matching the current criteria"
                         :
                          "No mandi data available"
                       }
                    </Text>
                    {mandis.length > 0 ? (
                         <Text style={styles.emptySubtext}>
                           Try adjusting your filters or check your location settings.
                         </Text>
                    ) : (
                        !loading && (
                           <Text style={styles.emptySubtext}>
                             Check your internet connection or try again later.
                           </Text>
                        )
                    )}
                     {activeFilter === 'distance' && !location && (
                         <Text style={styles.emptySubtext}>
                            Cannot sort by "Nearest" without location. Try "Best Price".
                         </Text>
                     )}
                  </View>
                 ) : null
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    // Use safeAreaContainer for the outermost container that wraps everything *within* the SafeAreaView
  safeAreaContainer: {
    flex: 1, // This is important so SafeAreaView fills the screen
    // Background color is applied here as well
  },
  // The main content container can now have flex: 1 without worrying about status bar/notch
  // container: { // This style is no longer needed or can be adjusted if you need an inner container
  //   flex: 1,
  // },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 12, // Keep vertical padding for spacing below title
  },
  loadingContainer: {
    flex: 1, // Loading view takes up the available space
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    // Ensure sufficient padding at the bottom for devices with home indicators
    paddingBottom: 80, // Adjust this value based on your bottom navigation height if any
  },
  mandiCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  marketName: {
    fontSize: 18,
    fontWeight: 'bold',
    flexShrink: 1,
    marginRight: 8,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  distanceText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  infoRow: {
    marginBottom: 10,
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  commodityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  commodityLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 6,
  },
  commodityValue: {
    fontSize: 15,
    fontWeight: '500',
    flexShrink: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  priceItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
   modalPriceItem: {
    flex: 1.2,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingVertical: 4,
    borderRadius: 6,
    justifyContent: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    textAlign: 'center',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalPriceLabel: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    textAlign: 'center',
  },
  modalPriceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    backgroundColor: 'transparent',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  filterButtonDisabled: {
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
    opacity: 0.8,
  },
  activeFilter: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterText: {
    marginLeft: 6,
    fontWeight: '500',
    color: '#4CAF50',
  },
  activeFilterText: {
    color: '#fff',
  },
  filterTextDisabled: {
      color: '#999',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF9A9A',
  },
  errorText: {
    marginLeft: 8,
    color: '#D32F2F',
    flex: 1,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});