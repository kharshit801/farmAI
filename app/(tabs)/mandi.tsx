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
  SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import Header from "@/components/Header";

// Sample data for Prayagraj region
const SAMPLE_MANDI_DATA = [
  {
    state: "Uttar Pradesh",
    district: "Prayagraj",
    market: "Naini Mandi",
    commodity: "Wheat",
    variety: "Sharbati",
    arrival_date: "2024-02-15",
    min_price: "2200",
    max_price: "2800", 
    modal_price: "2500",
    distance: 3.2
  },
  {
    state: "Uttar Pradesh",
    district: "Prayagraj",
    market: "Civil Lines Market",
    commodity: "Rice",
    variety: "Basmati",
    arrival_date: "2024-02-15",
    min_price: "3500",
    max_price: "4200",
    modal_price: "3800",
    distance: 1.5
  },
  {
    state: "Uttar Pradesh", 
    district: "Prayagraj",
    market: "Mundera Mandi",
    commodity: "Potato",
    variety: "Local",
    arrival_date: "2024-02-15",
    min_price: "800",
    max_price: "1200",
    modal_price: "1000",
    distance: 5.8
  },
  {
    state: "Uttar Pradesh",
    district: "Prayagraj",
    market: "Phulpur Market",
    commodity: "Onion",
    variety: "Red",
    arrival_date: "2024-02-15", 
    min_price: "1500",
    max_price: "2000",
    modal_price: "1800",
    distance: 8.4
  },
  {
    state: "Uttar Pradesh",
    district: "Prayagraj",
    market: "Jhunsi Mandi",
    commodity: "Mustard",
    variety: "Yellow",
    arrival_date: "2024-02-15",
    min_price: "4500",
    max_price: "5500",
    modal_price: "5000",
    distance: 4.2
  }
];

// Define the structure of a Mandi item from the API
interface Mandi {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety?: string;
  arrival_date: string;
  min_price: string;
  max_price: string;
  modal_price: string;
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

export default function MandiScreen() {
  const [mandis, setMandis] = useState<Mandi[]>(SAMPLE_MANDI_DATA);
  const [filteredMandis, setFilteredMandis] = useState<Mandi[]>(SAMPLE_MANDI_DATA);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('distance');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'granted' | 'denied' | 'failed'>('granted');

  const backgroundColor = useThemeColor({}, 'background') || '#ffffff';
  const textColor = useThemeColor({}, 'text') || '#000000';

  useEffect(() => {
    if (mandis && mandis.length > 0) {
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
    } else {
      setFilteredMandis([]);
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
          ]}>
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
          ]}>
            Best Price
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeAreaContainer, { backgroundColor }]}>
      <StatusBar style="auto" />

      <Header />

      <Text style={[styles.pageTitle, { color: textColor }]}>Prayagraj Mandis</Text>

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
              { length: 170, offset: 170 * index, index }
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
  safeAreaContainer: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
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
    paddingBottom: 80,
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
    color: '#6A994E',
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
    backgroundColor: '#1f1f1f',
    opacity: 0.8,
  },
  activeFilter: {
    backgroundColor: '#6A994E',
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