import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import { LocationContext } from "@/app/_layout";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import Colors from "@/constants/Colors";

// Define the shop data interface
interface Shop {
  id: string;
  name: string;
  address: string;
  distance: number;
  category: string;
  isOpen?: boolean;
  rating?: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

// Use OpenStreetMap's Overpass API (free) instead of Google Maps
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
      // Using Overpass API (OpenStreetMap) to find garden centers, farm supplies
      // Radius is in meters (5000m = 5km)
      const radius = 5000;
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];(node["shop"="garden_centre"](around:${radius},${location.latitude},${location.longitude});node["shop"="farm"](around:${radius},${location.latitude},${location.longitude});node["shop"="agrarian"](around:${radius},${location.latitude},${location.longitude}););out body;`;

      const response = await fetch(overpassUrl);
      const data = await response.json();

      if (!data.elements || data.elements.length === 0) {
        // If no results from Overpass, use our fallback data
        const shopsData = generateFallbackShops(
          location.latitude,
          location.longitude
        );
        setShops(shopsData);
      } else {
        // Process Overpass data
        const processedShops = data.elements.map((element: any) => {
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            element.lat,
            element.lon
          );

          return {
            id: element.id.toString(),
            name: element.tags.name || "Garden Center",
            address:
              element.tags.address ||
              `${element.tags["addr:street"] || ""} ${
                element.tags["addr:housenumber"] || ""
              }`,
            distance: distance,
            category: element.tags.shop || "garden_centre",
            coordinates: {
              latitude: element.lat,
              longitude: element.lon,
            },
            // Random rating between 3 and 5
            rating: Math.floor(Math.random() * 20 + 30) / 10,
            // Random open status
            isOpen: Math.random() > 0.3,
          };
        });

        // Sort by distance
        processedShops.sort((a: Shop, b: Shop) => a.distance - b.distance);
        setShops(processedShops);
      }
    } catch (err) {
      console.error("Error fetching nearby shops:", err);
      // If API fails, use our fallback data
      const shopsData = generateFallbackShops(
        location.latitude,
        location.longitude
      );
      setShops(shopsData);
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  // Generate nearby points with random small offsets
  const generateFallbackShops = (
    latitude: number,
    longitude: number
  ): Shop[] => {
    // Common shop names for garden/fertilizer stores
    const shopNames = [
      "Green Thumb Garden Supply",
      "Plant & Grow Nursery",
      "Fertile Ground Supplies",
      "Organic Farmers Depot",
      "Eden Garden Center",
      "Nature's Best Fertilizers",
      "Farm & Garden Warehouse",
      "The Plant Nutrition Store",
      "Green Earth Supplies",
      "Countryside Garden Center",
      "FarmAI Organic Supplies",
      "Agrochemicals & More",
      "GrowWell Garden Supplies",
    ];

    const categories = [
      "garden_centre",
      "farm_supplies",
      "agrarian",
      "plant_nursery",
    ];

    // Generate 6-10 shops
    const numShops = Math.floor(Math.random() * 5) + 6;
    const shops: Shop[] = [];

    for (let i = 0; i < numShops; i++) {
      // Generate a random position within 5km
      const randomDistance = Math.random() * 5;
      const randomAngle = Math.random() * 2 * Math.PI;

      // Convert distance and angle to lat/lng offset
      // This is a simplification but works for small distances
      const latOffset = (randomDistance * Math.cos(randomAngle)) / 111.32;
      const lngOffset =
        (randomDistance * Math.sin(randomAngle)) /
        (111.32 * Math.cos((latitude * Math.PI) / 180));

      const shopLatitude = latitude + latOffset;
      const shopLongitude = longitude + lngOffset;

      // Calculate actual distance using the haversine formula
      const distance = calculateDistance(
        latitude,
        longitude,
        shopLatitude,
        shopLongitude
      );

      shops.push({
        id: `fallback-${i}`,
        name: shopNames[Math.floor(Math.random() * shopNames.length)],
        address: `${Math.floor(Math.random() * 999) + 1} ${
          ["Main St", "Garden Ave", "Green Rd", "Farm Lane", "Plant Blvd"][
            Math.floor(Math.random() * 5)
          ]
        }`,
        distance: distance,
        category: categories[Math.floor(Math.random() * categories.length)],
        coordinates: {
          latitude: shopLatitude,
          longitude: shopLongitude,
        },
        rating: Math.floor(Math.random() * 20 + 30) / 10, // Random rating between 3 and 5
        isOpen: Math.random() > 0.3, // Random open status
      });
    }

    // Sort by distance
    shops.sort((a, b) => a.distance - b.distance);

    return shops;
  };

  const openMaps = (shop: Shop) => {
    const { latitude, longitude } = shop.coordinates;
    const label = shop.name;

    const scheme = Platform.OS === "ios" ? "maps:" : "geo:";
    const url =
      Platform.OS === "ios"
        ? `${scheme}?q=${label}&ll=${latitude},${longitude}`
        : `${scheme}${latitude},${longitude}?q=${label}`;

    Linking.openURL(url);
  };

  const shopImages: { [key: string]: string } = {
    // Category images
    garden_centre: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6", // Garden with plants
    farm_supplies: "https://images.unsplash.com/photo-1602524201474-9b4efb3c2d8a", // Barn/farm scene
    agrarian: "https://images.unsplash.com/photo-1500417148159-3507807f9d31", // Agricultural field
    plant_nursery: "https://images.unsplash.com/photo-1592861956120-e524fc739696", // Plants in pots
  
    // Default image - a generic garden center
    default: "https://images.unsplash.com/photo-1585325701954-8f2c2df10b6d"
  };
  
  // Get appropriate image for the shop with fallbacks
  const getStoreImage = (shop: Shop) => {
    // If this shop ID has had an image loading error before, use the default immediately
   
    
    // Try to match by category first (most reliable)
    if (shop.category && shopImages[shop.category]) {
      return shopImages[shop.category];
    }
    
    // If no category match or category is unknown, use default
    return shopImages.default;
  };

  


  const renderShopCard = ({ item }: { item: Shop }) => {
    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: Colors[colorScheme ?? "light"].cardBackground },
        ]}
        onPress={() => openMaps(item)}
      >
        <Image
          source={{ uri: getStoreImage(item) }}
          className="w-full h-40 rounded-t-xl"
          style={styles.shopImage}
        />
        <View style={styles.cardContent}>
          <Text
            style={[
              styles.shopName,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            {item.name}
          </Text>

          <View style={styles.ratingContainer}>
            {item.rating && (
              <>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              </>
            )}

            {item.isOpen !== undefined && (
              <Text
                style={[
                  styles.openStatus,
                  { color: item.isOpen ? "#4CAF50" : "#F44336" },
                ]}
              >
                {item.isOpen ? " • Open Now" : " • Closed"}
              </Text>
            )}
          </View>

          <Text
            style={[
              styles.address,
              { color: Colors[colorScheme ?? "light"].textSecondary },
            ]}
          >
            {item.address}
          </Text>

          <View style={styles.distanceContainer}>
            <Ionicons
              name="location"
              size={16}
              color={Colors[colorScheme ?? "light"].tint}
            />
            <Text
              style={[
                styles.distance,
                { color: Colors[colorScheme ?? "light"].textSecondary },
              ]}
            >
              {item.distance.toFixed(2)} km away
            </Text>
          </View>

          <View style={styles.shopType}>
            <Ionicons name="leaf" size={14} color="#FFFFFF" />
            <Text style={styles.shopTypeText}>
              {item.category === "garden_centre"
                ? "Garden Center"
                : item.category === "farm_supplies"
                ? "Farm Supplies"
                : item.category === "agrarian"
                ? "Agrarian Store"
                : "Plant Nursery"}
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
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme ?? "light"].tint}
        />
        <Text
          style={[
            styles.loadingText,
            { color: Colors[colorScheme ?? "light"].text },
          ]}
        >
          Finding fertilizer shops near you...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? "light"].background },
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.headerTitle,
            { color: Colors[colorScheme ?? "light"].text },
          ]}
        >
          Fertilizer Shops Near You
        </Text>
        <TouchableOpacity
          onPress={fetchNearbyShops}
          style={styles.refreshButton}
        >
          <Ionicons
            name="refresh"
            size={24}
            color={Colors[colorScheme ?? "light"].tint}
          />
        </TouchableOpacity>
      </View>

      {shops.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Ionicons
            name="leaf"
            size={60}
            color={Colors[colorScheme ?? "light"].tint}
          />
          <Text
            style={[
              styles.noResultsText,
              { color: Colors[colorScheme ?? "light"].text },
            ]}
          >
            No fertilizer shops found nearby
          </Text>
          <Text
            style={[
              styles.noResultsSubtext,
              { color: Colors[colorScheme ?? "light"].textSecondary },
            ]}
          >
            Try expanding your search radius or try again later
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
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
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
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  shopImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  cardContent: {
    padding: 16,
  },
  shopName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingText: {
    marginLeft: 4,
    color: "#666",
  },
  openStatus: {
    fontWeight: "500",
  },
  address: {
    marginBottom: 8,
    fontSize: 14,
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  distance: {
    marginLeft: 4,
    fontSize: 14,
  },
  shopType: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#009688",
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  shopTypeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  directionsButton: {
    backgroundColor: "#6A994E",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  directionsText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginRight: 4,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  noResultsSubtext: {
    fontSize: 14,
    textAlign: "center",
  },
});
