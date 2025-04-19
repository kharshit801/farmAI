import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import MapView, { Polygon } from "react-native-maps";
import { MaterialIcons, Feather, Ionicons } from "@expo/vector-icons";
import { useField } from "../context/fieldcontext";
import { calculateCenter } from "../components/cropService";

// API key for OpenWeatherMap
const OPENWEATHERMAP_API_KEY = '5942ca62c79ba3159881b814558fb0ae';

const getWeatherIcon = (condition: string) => {
  switch (condition.toLowerCase()) {
    case "clear":
      return "sun";
    case "clouds":
      return "cloud";
    case "rain":
      return "cloud-rain";
    case "snow":
      return "cloud-snow";
    case "thunderstorm":
      return "cloud-lightning";
    default:
      return "sun";
  }
};

const ManageField = () => {
  const router = useRouter();
  const { selectedField } = useField();

  interface WeatherData {
    current: {
      temp: number;
      weather: {
        main: string;
        description: string;
        icon: string;
      };
      humidity: number;
      wind_speed: number;
      precipitation: number;
      uvi: number;
      clouds: number;
    };
    daily: {
      temp: { day: number; min: number; max: number };
      precipitation: number;
      weather: { main: string };
    }[];
  }

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWeatherData = async () => {
      if (!selectedField) {
        router.back();
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get field center coordinates
        const centerPoint = calculateCenter(selectedField.coordinates);

        // Fetch current weather data
        const currentResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${centerPoint.latitude}&lon=${centerPoint.longitude}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`
        );

        if (!currentResponse.ok) {
          const errorData = await currentResponse.json();
          throw new Error(errorData.message || 'Failed to fetch current weather data');
        }

        const currentData = await currentResponse.json();

        // Fetch 5-day forecast data
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${centerPoint.latitude}&lon=${centerPoint.longitude}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`
        );

        if (!forecastResponse.ok) {
          const errorData = await forecastResponse.json();
          throw new Error(errorData.message || 'Failed to fetch forecast data');
        }

        const forecastData = await forecastResponse.json();

        // Structure the weather data to match the expected format
        const formattedWeather: WeatherData = {
          current: {
            temp: Math.round(currentData.main.temp),
            weather: {
              main: currentData.weather[0].main,
              description: currentData.weather[0].description,
              icon: currentData.weather[0].icon,
            },
            humidity: currentData.main.humidity,
            wind_speed: currentData.wind.speed,
            precipitation: currentData.rain ? currentData.rain["1h"] || 0 : 0,
            uvi: currentData.uvi || 0, // Note: UVI is not available in free tier, using 0 as fallback
            clouds: currentData.clouds.all,
          },
          daily: forecastData.list
            .filter((item: any) => item.dt_txt.includes("12:00:00")) // Get daily data at noon
            .slice(0, 5) // Limit to 5 days
            .map((item: any) => ({
              temp: {
                day: Math.round(item.main.temp),
                min: Math.round(item.main.temp_min),
                max: Math.round(item.main.temp_max),
              },
              precipitation: item.rain ? item.rain["3h"] || 0 : 0,
              weather: { main: item.weather[0].main },
            })),
        };

        setWeather(formattedWeather);
      } catch (error: any) {
        console.error("Error fetching weather data:", error);
        setError(error.message || 'Unable to load weather data');
      } finally {
        setLoading(false);
      }
    };

    loadWeatherData();
  }, [selectedField]);

  if (!selectedField) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>No field selected</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0055FF" />
          <Text style={styles.loadingText}>Loading field data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.weatherDescription}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const centerPoint = calculateCenter(selectedField.coordinates);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedField.name}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Field Image & Map */}
        <View style={styles.imageSection}>
          <Image
            source={selectedField.image}
            style={styles.fieldImage}
            defaultSource={require("../assets/images/fieldimage.jpg")}
          />

          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: centerPoint.latitude,
                longitude: centerPoint.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Polygon
                coordinates={selectedField.coordinates}
                strokeColor="#0055FF"
                fillColor="rgba(0, 85, 255, 0.2)"
                strokeWidth={2}
              />
            </MapView>
          </View>
        </View>

        {/* Field Info */}
        <View style={styles.fieldInfoCard}>
          <View style={styles.fieldInfoRow}>
            <View style={styles.fieldInfoItem}>
              <Text style={styles.fieldInfoLabel}>Crop</Text>
              <View style={styles.cropBadge}>
                <Text style={styles.cropEmoji}>
                  {selectedField.crop === "Banana" ? "🍌" : "🌱"}
                </Text>
                <Text style={styles.cropName}>{selectedField.crop}</Text>
              </View>
            </View>

            <View style={styles.fieldInfoItem}>
              <Text style={styles.fieldInfoLabel}>Area</Text>
              <Text style={styles.fieldInfoValue}>
                {selectedField.area} Acres
              </Text>
            </View>

            <View style={styles.fieldInfoItem}>
              <Text style={styles.fieldInfoLabel}>Location</Text>
              <View style={styles.locationContainer}>
                <MaterialIcons name="location-on" size={16} color="#555" />
                <Text style={styles.locationText}>
                  {selectedField.location}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Current Weather */}
        <View style={styles.weatherCard}>
          <Text style={styles.sectionTitle}>Current Weather</Text>

          {weather ? (
            <View style={styles.currentWeatherContainer}>
              <View style={styles.weatherMain}>
                <Feather
                  name={getWeatherIcon(weather.current.weather.main)}
                  size={64}
                  color="#0055FF"
                />
                <Text style={styles.temperatureText}>
                  {weather.current.temp}°C
                </Text>
                <Text style={styles.weatherDescription}>
                  {weather.current.weather.description}
                </Text>
              </View>

              <View style={styles.weatherDetailsList}>
                <View style={styles.weatherDetailItem}>
                  <Feather name="droplet" size={20} color="#555" />
                  <Text style={styles.weatherDetailText}>
                    Humidity: {weather.current.humidity}%
                  </Text>
                </View>

                <View style={styles.weatherDetailItem}>
                  <Feather name="wind" size={20} color="#555" />
                  <Text style={styles.weatherDetailText}>
                    Wind: {weather.current.wind_speed} m/s
                  </Text>
                </View>

                <View style={styles.weatherDetailItem}>
                  <Ionicons name="water-outline" size={20} color="#555" />
                  <Text style={styles.weatherDetailText}>
                    Precipitation: {weather.current.precipitation}%
                  </Text>
                </View>

                <View style={styles.weatherDetailItem}>
                  <Ionicons name="sunny-outline" size={20} color="#555" />
                  <Text style={styles.weatherDetailText}>
                    UV Index: {weather.current.uvi}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.weatherDescription}>
              Weather data is not available.
            </Text>
          )}
        </View>

        {/* Weather Forecast */}
        <View style={styles.forecastCard}>
          <Text style={styles.sectionTitle}>5-Day Forecast</Text>

          {weather ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {weather.daily.map((day, index) => (
                <View key={index} style={styles.forecastDay}>
                  <Text style={styles.forecastDayText}>
                    {["Today", "Tomorrow", `Day ${index + 1}`][index] ||
                      `Day ${index + 1}`}
                  </Text>
                  <Feather
                    name={getWeatherIcon(day.weather.main)}
                    size={32}
                    color="#0055FF"
                  />
                  <Text style={styles.forecastTemp}>{day.temp.day}°C</Text>
                  <View style={styles.tempRange}>
                    <Text style={styles.tempRangeText}>
                      {day.temp.min}° | {day.temp.max}°
                    </Text>
                  </View>
                  <View style={styles.precipitationIndicator}>
                    <Feather name="droplet" size={12} color="#0055FF" />
                    <Text style={styles.precipitationText}>
                      {day.precipitation}%
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.weatherDescription}>
              Forecast data is not available.
            </Text>
          )}
        </View>

        {/* Field Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Field Actions</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconContainer}>
                <MaterialIcons name="edit" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>Edit Field</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIconContainer, styles.wateringIcon]}>
                <Ionicons name="water" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>Irrigation</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIconContainer, styles.analyticsIcon]}>
                <MaterialIcons name="insert-chart" size={24} color="white" />
              </View>
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#555",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  placeholder: {
    width: 24,
  },
  imageSection: {
    position: "relative",
    height: 200,
    backgroundColor: "#e9ecef",
  },
  fieldImage: {
    width: "100%",
    height: "100%",
  },
  mapContainer: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "white",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  fieldInfoCard: {
    margin: 16,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fieldInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  fieldInfoItem: {
    marginBottom: 8,
    minWidth: "30%",
  },
  fieldInfoLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  fieldInfoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  cropBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 85, 255, 0.1)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  cropEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  cropName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0055FF",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 14,
    marginLeft: 4,
    color: "#555",
  },
  weatherCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  currentWeatherContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weatherMain: {
    alignItems: "center",
    flex: 1,
  },
  temperatureText: {
    fontSize: 36,
    fontWeight: "bold",
    marginTop: 8,
    color: "#333",
  },
  weatherDescription: {
    fontSize: 16,
    color: "#555",
    marginTop: 4,
  },
  weatherDetailsList: {
    flex: 1,
    marginLeft: 16,
  },
  weatherDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  weatherDetailText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#555",
  },
  forecastCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  forecastDay: {
    alignItems: "center",
    marginRight: 24,
    minWidth: 72,
  },
  forecastDayText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  forecastTemp: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
    color: "#333",
  },
  tempRange: {
    marginTop: 4,
  },
  tempRangeText: {
    fontSize: 12,
    color: "#888",
  },
  precipitationIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  precipitationText: {
    fontSize: 12,
    marginLeft: 4,
    color: "#0055FF",
  },
  actionsCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    alignItems: "center",
    width: "30%",
  },
  actionIconContainer: {
    backgroundColor: "#0055FF",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  wateringIcon: {
    backgroundColor: "#00C853",
  },
  analyticsIcon: {
    backgroundColor: "#FF6D00",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#555",
  },
});

export default ManageField;