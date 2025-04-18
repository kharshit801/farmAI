import React, { useContext, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  FlatList, 
  Image, 
  TouchableOpacity,
  Linking,
  Platform
} from 'react-native';
import { LocationContext } from '@/app/_layout';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';

// Define the shop data interface
interface Shop {
  id: string;
  name: string;
  vicinity: string;
  rating?: number;
  photos?: { photo_reference: string }[];
  opening_hours?: {
    open_now?: boolean;
  };
  geometry: {
    location: {
      lat: number;
      lng: number;
    }
  };
  distance?: number; // Distance in kilometers
}

const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY_HERE'; // Replace with your actual API key

export default function ShopScreenComponent() {
  const { location } = useContext(LocationContext);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Fetch nearby fertilizer shops when location is available
    if (location) {
      fetchNearbyShops();
    }
  }, [location]);

  const fetchNearbyShops = async () => {
    if (!location) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Search for "fertilizer shop" or "garden supplies" nearby
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=5000&type=store&keyword=fertilizer%20garden%20supplies%20plant&key=${GOOGLE_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Error fetching shops: ${data.status}`);
      }
      
      // Calculate distance for each shop
      const shopsWithDistance = data.results.map((shop: Shop) => {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          shop.geometry.location.lat,
          shop.geometry.location.lng
        );
        
        return {
          ...shop,
          distance
        };
      });
      
      // Sort by distance
      shopsWithDistance.sort((a: Shop, b: Shop) => (a.distance || 0) - (b.distance || 0));
      
      setShops(shopsWithDistance);
    } catch (err) {
      console.error('Error fetching nearby shops:', err);
      setError('Failed to load nearby shops. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI/180);
  };

  const getPhotoUrl = (photoReference: string) => {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`;
  };

  const openMaps = (shop: Shop) => {
    const { lat, lng } = shop.geometry.location;
    const label = shop.name;
    
    const scheme = Platform.OS === 'ios' ? 'maps:' : 'geo:';
    const url = Platform.OS === 'ios' 
      ? `${scheme}?q=${label}&ll=${lat},${lng}` 
      : `${scheme}${lat},${lng}?q=${label}`;
      
    Linking.openURL(url);
  };

  const renderShopCard = ({ item }: { item: Shop }) => {
    return (
      <TouchableOpacity 
        style={[
          styles.card, 
          { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
        ]}
        onPress={() => openMaps(item)}
      >
        <Image 
          source={{ 
            uri: item.photos && item.photos.length > 0 
              ? getPhotoUrl(item.photos[0].photo_reference)
              : 'https://via.placeholder.com/150?text=No+Image' 
          }}
          style={styles.shopImage}
        />
        <View style={styles.cardContent}>
          <Text style={[styles.shopName, { color: Colors[colorScheme ?? 'light'].text }]}>
            {item.name}
          </Text>
          
          <View style={styles.ratingContainer}>
            {item.rating && (
              <>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              </>
            )}
            
            {item.opening_hours?.open_now !== undefined && (
              <Text style={[
                styles.openStatus,
                { color: item.opening_hours.open_now ? '#4CAF50' : '#F44336' }
              ]}>
                {item.opening_hours.open_now ? ' • Open Now' : ' • Closed'}
              </Text>
            )}
          </View>
          
          <Text style={[styles.address, { color: Colors[colorScheme ?? 'light'].textSecondary }]}>
            {item.vicinity}
          </Text>
          
          <View style={styles.distanceContainer}>
            <Ionicons name="location" size={16} color={Colors[colorScheme ?? 'light'].tint} />
            <Text style={[styles.distance, { color: Colors[colorScheme ?? 'light'].textSecondary }]}>
              {item.distance ? `${item.distance.toFixed(2)} km away` : 'Distance unknown'}
            </Text>
          </View>
          
          <View style={styles.directionsButton}>
            <Text style={styles.directionsText}>Get Directions</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !shops.length) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>
          Finding fertilizer shops near you...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="alert-circle" size={50} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchNearbyShops}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[
      styles.container, 
      { backgroundColor: Colors[colorScheme ?? 'light'].background }
    ]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          Fertilizer Shops Near You
        </Text>
        <TouchableOpacity onPress={fetchNearbyShops} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={Colors[colorScheme ?? 'light'].tint} />
        </TouchableOpacity>
      </View>
      
      {shops.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Ionicons name="leaf" size={60} color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={[styles.noResultsText, { color: Colors[colorScheme ?? 'light'].text }]}>
            No fertilizer shops found nearby
          </Text>
          <Text style={[styles.noResultsSubtext, { color: Colors[colorScheme ?? 'light'].textSecondary }]}>
            Try expanding your search radius or trying a different location
          </Text>
        </View>
      ) : (
        <FlatList
          data={shops}
          renderItem={renderShopCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  list: {
    paddingBottom: 16,
  },
  card: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  shopImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 16,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    marginLeft: 4,
    color: '#666',
  },
  openStatus: {
    fontWeight: '500',
  },
  address: {
    marginBottom: 8,
    fontSize: 14,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  distance: {
    marginLeft: 4,
    fontSize: 14,
  },
  directionsButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  directionsText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 4,
  },
  errorText: {
    marginTop: 16,
    color: '#F44336',
    textAlign: 'center',
    fontSize: 16,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});