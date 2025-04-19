import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useField } from '../context/fieldcontext'; // Ensure this path is correct
import { Julep } from '@julep/sdk';
import { calculateCenter } from './../components/utils/Cropservice'; // Ensure this path is correct

// --- Constants ---
const JULEP_AGENT_ID = "06802005-adc9-75f1-8000-5ea756eb8532";
const JULEP_API_KEY = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTAxNTkwMTcsImlhdCI6MTc0NDk3NTAxNywic3ViIjoiNjVhMWE5MzYtYjBlMy01OTI0LTk3NzQtNjU1NDVmYmYwNTgyIn0.QbU03Bwv5Qv4Wv5sKuXu26wE9vac0lguHwKlUfzVeLvwVY1-UlMT7kr3h8K6XQEQJUn925NB5OD4uLR0jPHRAQ";
const JULEP_POLLING_TIMEOUT_MS = 30000; // Reduced timeout to 30 seconds
const JULEP_POLLING_INTERVAL_MS = 2000; // Reduced polling interval
const OPENWEATHER_API_KEY = "5942ca62c79ba3159881b814558fb0ae";
const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";

// --- Simplified Julep Task Definition ---
const julepCropRecommendationTask = {
  name: 'Field Crop Recommendations',
  description: 'Get crop recommendations based on field data and weather conditions',
  main: [
    {
      type: 'prompt',
      prompt: `
      You are an agricultural advisor. Analyze this field and weather data:
      - Location: {steps[0].input.location}
      - Temperature: {steps[0].input.currentTemp}°C
      - Humidity: {steps[0].input.humidity}%
      - Precipitation: {steps[0].input.precipitation} mm
      - Wind speed: {steps[0].input.windSpeed} m/s
      - Weather condition: {steps[0].input.weatherDescription}
      - Field Area: {steps[0].input.area} Acres
      - Current Crop: {steps[0].input.currentCrop}

      Return a JSON response in exactly this format (no extra text or formatting outside the JSON):
      {
        "recommendedCrops": [
          {
            "name": "Crop Name",
            "suitabilityScore": "Score/10",
            "reason": "Reason based on weather conditions"
          }
        ],
        "currentCropAnalysis": "Analysis of current crop's suitability",
        "cultivationAdvice": "Advice for cultivation under current conditions",
        "immediateActions": [
          "Action 1 based on current weather",
          "Action 2 if applicable"
        ],
        "longTermPlan": "Long-term suggestion for planning"
      }
      `
    },
  ],
};

// --- Interface Definitions ---
interface Coordinate {
  latitude: number;
  longitude: number;
}

interface Weather {
  current: {
    temp: number;
    feels_like: number;
    weather: {
      main: string;
      description: string;
      icon: string;
    };
    humidity: number;
    wind_speed: number;
    precipitation: number;
    clouds: number;
    uvi: number;
  };
}

interface Field {
  id: string;
  name: string;
  location: string;
  coordinates: Coordinate[];
  area: number;
  crop?: string;
  image: any;
  weather?: Weather;
}

interface CropRecommendation {
  name: string;
  suitabilityScore: string;
  reason: string;
}

interface AIRecommendation {
  recommendedCrops: CropRecommendation[];
  currentCropAnalysis: string;
  cultivationAdvice: string;
  immediateActions: string[];
  longTermPlan: string;
}

// --- Component ---
const Plan = () => {
  const router = useRouter();
  const { selectedField, setSelectedField } = useField();
  const [recommendations, setRecommendations] = useState<AIRecommendation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const julepClient = useRef<Julep | null>(null);
  const isMounted = useRef<boolean>(true); // Initialize as true
  const abortController = useRef<AbortController | null>(null);

  // Cleanup function to handle unmounting safely
  const cleanup = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
  }, []);

  // Fetch weather data and get AI recommendations
  const fetchWeatherDataAndRecommendations = useCallback(async () => {
    if (!isMounted.current) {
      console.log("[Plan] Fetch aborted: Component not mounted.");
      return;
    }
    
    // Cleanup any existing requests
    cleanup();
    
    // Create new abort controller
    abortController.current = new AbortController();
    
    console.log("[Plan] Starting data fetch sequence...");

    // Validate field data
    if (!selectedField || !selectedField.coordinates || selectedField.coordinates.length === 0) {
      console.warn("[Plan] Aborting fetch: Invalid field data.", selectedField);
      setError("Field data is incomplete or missing coordinates.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Set states
    if (!refreshing) {
      setLoading(true);
    }
    setError(null);

    let weatherData: Weather | null = null;

    // 1. Fetch Weather Data
    try {
      console.log("[Plan] [Weather] Fetching weather data...");
      const center = calculateCenter(selectedField.coordinates);
      
      if (!center || typeof center.latitude !== 'number' || typeof center.longitude !== 'number') {
        throw new Error("Invalid center coordinates calculated.");
      }
      
      const weatherUrl = `${WEATHER_API_URL}?lat=${center.latitude}&lon=${center.longitude}&units=metric&appid=${OPENWEATHER_API_KEY}`;
      const weatherResponse = await fetch(weatherUrl, { 
        signal: abortController.current?.signal 
      });

      if (!weatherResponse.ok) {
        throw new Error(`Weather API error: ${weatherResponse.status}`);
      }

      const weatherDataRaw = await weatherResponse.json();

      // Parse weather data
      weatherData = {
        current: {
          temp: weatherDataRaw.main?.temp ?? 0,
          feels_like: weatherDataRaw.main?.feels_like ?? 0,
          weather: {
            main: weatherDataRaw.weather[0]?.main ?? 'Unknown',
            description: weatherDataRaw.weather[0]?.description ?? 'No description',
            icon: weatherDataRaw.weather[0]?.icon ?? '',
          },
          humidity: weatherDataRaw.main?.humidity ?? 0,
          wind_speed: weatherDataRaw.wind?.speed ?? 0,
          precipitation: weatherDataRaw.rain?.['1h'] || weatherDataRaw.snow?.['1h'] || 0,
          clouds: weatherDataRaw.clouds?.all ?? 0,
          uvi: 0, // Default value
        },
      };

      // Update selected field with weather data
      if (isMounted.current) {
        setSelectedField({
          ...selectedField,
          weather: weatherData
        });
      } else {
        return; // Exit if component unmounted
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("[Plan] [Weather] Fetch aborted");
        return;
      }
      
      console.error("[Plan] [Weather] Error:", err);
      if (isMounted.current) {
        setError(`Weather fetch failed: ${err.message}`);
        setLoading(false);
        setRefreshing(false);
      }
      return;
    }

    // Check mount status before proceeding
    if (!isMounted.current) {
      return;
    }

    // 2. Fetch AI Recommendations
    console.log("[Plan] [Julep] Getting AI recommendations...");
    try {
      if (!julepClient.current) {
        throw new Error("AI service client not initialized");
      }
      
      if (!weatherData) {
        throw new Error("Weather data missing");
      }

      // Prepare input data
      const inputData = {
        location: selectedField.location,
        currentTemp: weatherData.current.temp,
        feelsLikeTemp: weatherData.current.feels_like,
        humidity: weatherData.current.humidity,
        precipitation: weatherData.current.precipitation,
        windSpeed: weatherData.current.wind_speed,
        cloudCover: weatherData.current.clouds,
        weatherDescription: weatherData.current.weather.description,
        currentCrop: selectedField.crop || "None",
        area: selectedField.area,
      };

      // Create task & execute
      const task = await julepClient.current.tasks.create(JULEP_AGENT_ID, julepCropRecommendationTask);
      console.log("[Plan] [Julep] Task created:", task.id);
      
      const execution = await julepClient.current.executions.create(task.id, { input: inputData });
      const executionId = execution.id;
      console.log(`[Plan] [Julep] Execution created: ${executionId}, Status: ${execution.status}`);

      // Polling
      const startTime = Date.now();
      let executionResult: any = null;

      while (Date.now() - startTime < JULEP_POLLING_TIMEOUT_MS) {
        if (!isMounted.current) {
          console.log(`[Plan] [Julep] Polling aborted: Component unmounted`);
          return;
        }

        try {
          executionResult = await julepClient.current.executions.get(executionId);
          
          if (executionResult?.status === 'succeeded') {
            const responseText = executionResult.output?.choices?.[0]?.message?.content;
            
            if (responseText) {
              try {
                // Clean up the response for JSON parsing
                let cleanedResponse = responseText.trim();
                
                // Remove markdown code blocks if present
                if (cleanedResponse.startsWith('```json')) {
                  cleanedResponse = cleanedResponse.substring(7);
                  if (cleanedResponse.endsWith('```')) {
                    cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
                  }
                } else if (cleanedResponse.startsWith('```')) {
                  cleanedResponse = cleanedResponse.substring(3);
                  if (cleanedResponse.endsWith('```')) {
                    cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
                  }
                }
                
                cleanedResponse = cleanedResponse.trim();
                
                // Parse JSON
                const parsedResponse = JSON.parse(cleanedResponse);
                console.log("[Plan] [Julep] Parsed response successfully");
                
                if (isMounted.current) {
                  setRecommendations(parsedResponse);
                  setError(null);
                }
                
                break; // Exit loop on success
              } catch (parseError: any) {
                console.error("[Plan] [Julep] JSON parse error:", parseError);
                
                // Attempt fallback parsing
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  try {
                    const parsedFallback = JSON.parse(jsonMatch[0]);
                    if (isMounted.current) {
                      setRecommendations(parsedFallback);
                      setError(null);
                    }
                    break;
                  } catch (fallbackError) {
                    throw new Error("Failed to parse AI response");
                  }
                } else {
                  throw new Error("Invalid AI response format");
                }
              }
            } else {
              throw new Error("Empty AI response");
            }
          } else if (executionResult?.status === 'failed') {
            throw new Error(executionResult.error?.message || "AI processing failed");
          }
          
          // Wait before next poll
          await new Promise(resolve => setTimeout(resolve, JULEP_POLLING_INTERVAL_MS));
          
        } catch (pollError: any) {
          console.error(`[Plan] [Julep] Polling error:`, pollError);
          
          // Check if we should continue polling or break with error
          if (Date.now() - startTime >= JULEP_POLLING_TIMEOUT_MS) {
            throw new Error("AI analysis timed out");
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, JULEP_POLLING_INTERVAL_MS));
        }
      }
      
      // If we exited the loop without success
      if (isMounted.current && !recommendations && !error) {
        setError("AI analysis timed out");
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("[Plan] [Julep] Operation aborted");
        return;
      }
      
      console.error("[Plan] [Julep] Error:", err);
      if (isMounted.current) {
        setError(`AI analysis failed: ${err.message}`);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [selectedField, setSelectedField, refreshing, cleanup]);

  // Initialize Julep client on mount
  useEffect(() => {
    console.log("[Plan] Component mounted");
    isMounted.current = true;

    // Initialize Julep client
    if (!julepClient.current) {
      try {
        julepClient.current = new Julep({ apiKey: JULEP_API_KEY });
        console.log("[Plan] Julep client initialized");
      } catch (initError: any) {
        console.error("[Plan] Julep client init error:", initError);
        setError(`Failed to initialize AI service: ${initError.message}`);
      }
    }

    // Cleanup on unmount
    return () => {
      console.log("[Plan] Component unmounting");
      isMounted.current = false;
      cleanup();
    };
  }, [cleanup]);

  // Fetch data when selectedField changes
  useEffect(() => {
    if (selectedField && julepClient.current && isMounted.current) {
      fetchWeatherDataAndRecommendations();
    } else if (!selectedField && isMounted.current) {
      setError("No field selected");
      setLoading(false);
      setRecommendations(null);
    }
  }, [selectedField, fetchWeatherDataAndRecommendations]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    console.log("[Plan] Refresh triggered");
    setRefreshing(true);
    if (selectedField) {
      fetchWeatherDataAndRecommendations();
    } else {
      setError("No field selected to refresh");
      setRefreshing(false);
    }
  }, [selectedField, fetchWeatherDataAndRecommendations]);

  // --- Render Logic ---
  
  // 1. Client initialization error
  if (!julepClient.current && error?.includes("initialize AI service")) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Field Planning Error' }} />
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={40} color="#FF3B30" />
          <Text style={styles.errorTitle}>AI Service Unavailable</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 2. No Field Selected
  if (!selectedField) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Field Planning' }} />
        <ScrollView contentContainerStyle={styles.emptyState}>
          <Ionicons name="leaf-outline" size={60} color="#cccccc" />
          <Text style={styles.emptyStateText}>No Field Selected</Text>
          <Text style={styles.emptyStateSubText}>Go to the 'Fields' tab and choose a field to view planning advice.</Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => router.push('/fields')}
          >
            <Text style={styles.emptyStateButtonText}>Select a Field</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 3. Main Content
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: `Plan: ${selectedField.name}` }} />

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0055FF"
            colors={["#0055FF"]}
          />
        }
      >
        {/* Field Summary Card */}
        <View style={styles.fieldSummaryCard}>
          <View style={styles.fieldImageContainer}>
            <Image
              source={selectedField.image || require("../assets/images/fieldimage.jpg")}
              style={styles.fieldImage}
              resizeMode="cover"
            />
            <View style={styles.fieldOverlay}>
              <Text style={styles.fieldName}>{selectedField.name}</Text>
              <View style={styles.fieldDetailsRow}>
                <View style={styles.fieldDetailItem}>
                  <MaterialIcons name="grass" size={16} color="#fff" />
                  <Text style={styles.fieldDetailText}>{selectedField.area} Acres</Text>
                </View>
                <View style={styles.fieldDetailItem}>
                  <MaterialIcons name="location-pin" size={16} color="#fff" />
                  <Text style={styles.fieldDetailText} numberOfLines={1} ellipsizeMode="tail">{selectedField.location}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Weather Summary */}
          <View style={styles.weatherSummary}>
            <Text style={styles.sectionSubtitle}>Current Conditions</Text>
            {selectedField.weather ? (
              <>
                <View style={styles.weatherRow}>
                  <View style={styles.weatherItem}>
                    <FontAwesome5 name="temperature-half" size={16} color="#FF8C00" />
                    <Text style={styles.weatherValue}>{selectedField.weather.current.temp.toFixed(1)}°C</Text>
                    <Text style={styles.weatherLabel}>Temp</Text>
                  </View>
                  <View style={styles.weatherItem}>
                    <FontAwesome5 name="cloud-rain" size={16} color="#4682B4" />
                    <Text style={styles.weatherValue}>{selectedField.weather.current.precipitation.toFixed(1)} mm/h</Text>
                    <Text style={styles.weatherLabel}>Precip</Text>
                  </View>
                  <View style={styles.weatherItem}>
                    <FontAwesome5 name="wind" size={16} color="#87CEEB" />
                    <Text style={styles.weatherValue}>{selectedField.weather.current.wind_speed.toFixed(1)} m/s</Text>
                    <Text style={styles.weatherLabel}>Wind</Text>
                  </View>
                  <View style={styles.weatherItem}>
                    <Ionicons name="water" size={16} color="#ADD8E6" />
                    <Text style={styles.weatherValue}>{selectedField.weather.current.humidity}%</Text>
                    <Text style={styles.weatherLabel}>Humidity</Text>
                  </View>
                </View>
                <Text style={styles.weatherDescription}>
                  {selectedField.weather.current.weather.description.charAt(0).toUpperCase() + selectedField.weather.current.weather.description.slice(1)}
                  {` (Feels like ${selectedField.weather.current.feels_like.toFixed(1)}°C)`}
                </Text>
              </>
            ) : (
              loading && !error ? (
                <View style={styles.centeredContent}>
                  <ActivityIndicator size="small" color="#0055FF" />
                  <Text style={styles.inlineLoadingText}>Fetching weather...</Text>
                </View>
              ) : (
                <Text style={styles.weatherPlaceholder}>Weather data unavailable.</Text>
              )
            )}
          </View>
        </View>

        {/* AI Recommendations Section */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0055FF" />
            <Text style={styles.loadingText}>
              Analyzing field conditions and generating recommendations...
            </Text>
            <Text style={styles.loadingSubText}>
              This may take up to {JULEP_POLLING_TIMEOUT_MS / 1000} seconds.
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={40} color="#FF3B30" />
            <Text style={styles.errorTitle}>Analysis Failed</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <MaterialIcons name="refresh" size={18} color="white" style={{ marginRight: 5 }}/>
              <Text style={styles.retryButtonText}>Retry Analysis</Text>
            </TouchableOpacity>
          </View>
        ) : recommendations ? (
          <>
            {/* Recommended Crops Card */}
            <View style={[styles.cardBase, styles.recommendationsCard]}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="leaf-outline" size={20} color="#2E8B57" style={styles.sectionTitleIcon} /> Recommended Crops
              </Text>
              {recommendations.recommendedCrops && recommendations.recommendedCrops.length > 0 ? (
                recommendations.recommendedCrops.map((crop, index) => (
                  <View key={`${crop.name}-${index}`} style={styles.cropRecommendation}>
                    <View style={styles.cropHeader}>
                      <Text style={styles.cropName}>{crop.name || 'Unknown Crop'}</Text>
                      {crop.suitabilityScore && (
                        <View style={styles.scoreChip}>
                          <Text style={styles.scoreText}>{crop.suitabilityScore}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cropReason}>{crop.reason || 'No reason provided.'}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No specific crop recommendations available.</Text>
              )}
            </View>

            {/* Current Crop Analysis Card */}
            {selectedField.crop && recommendations.currentCropAnalysis && recommendations.currentCropAnalysis.toLowerCase() !== 'n/a' && (
              <View style={[styles.cardBase, styles.analysisCard]}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="stats-chart-outline" size={20} color="#4682B4" style={styles.sectionTitleIcon}/> Current Crop: {selectedField.crop}
                </Text>
                <Text style={styles.analysisText}>{recommendations.currentCropAnalysis}</Text>
              </View>
            )}

            {/* Cultivation Advice Card */}
            {recommendations.cultivationAdvice && (
              <View style={[styles.cardBase, styles.adviceCard]}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="build-outline" size={20} color="#DAA520" style={styles.sectionTitleIcon}/> Cultivation Advice
                </Text>
                <Text style={styles.adviceText}>{recommendations.cultivationAdvice}</Text>
              </View>
            )}

            {/* Immediate Actions Card */}
            {recommendations.immediateActions && recommendations.immediateActions.length > 0 && (
              <View style={[styles.cardBase, styles.actionsCard]}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="flash-outline" size={20} color="#FF4500" style={styles.sectionTitleIcon}/> Immediate Actions
                </Text>
                {recommendations.immediateActions.map((action, index) => (
                  <View key={`action-${index}`} style={styles.actionItem}>
                    <View style={styles.actionBullet}>
                      <Ionicons name="chevron-forward" size={14} color="white" />
                    </View>
                    <Text style={styles.actionText}>{action || 'No action specified.'}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Long Term Strategy Card */}
            {recommendations.longTermPlan && (
              <View style={[styles.cardBase, styles.planCard]}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="calendar-clear-outline" size={20} color="#8A2BE2" style={styles.sectionTitleIcon}/> Long Term Strategy
                </Text>
                <Text style={styles.planText}>{recommendations.longTermPlan}</Text>
              </View>
            )}
          </>
        ) : (
          !loading && !error && (
            <View style={styles.noDataContainer}>
              <Ionicons name="information-circle-outline" size={40} color="#cccccc" />
              <Text style={styles.noDataText}>No planning information available.</Text>
              <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                <MaterialIcons name="refresh" size={18} color="white" style={{ marginRight: 5 }}/>
                <Text style={styles.retryButtonText}>Try Refreshing</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles --- (Keep the styles StyleSheet definition from your previous code)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F9', // Slightly different background
  },
  scrollViewContent: {
      paddingBottom: 32, // Ensure space at the bottom
      flexGrow: 1, // Ensure ScrollView takes up space even if content is short (for empty states)
  },
  // Centered content utility
  centeredContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  inlineLoadingText: {
      marginTop: 8,
      fontSize: 13,
      color: '#666',
  },
  // Field Summary Card
  fieldSummaryCard: {
    marginHorizontal: 12, // Slightly less horizontal margin
    marginTop: 16,
    marginBottom: 16, // Space below card
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden', // Clip image corners
    shadowColor: '#405161', // Darker shadow color
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1, // Subtle shadow
    shadowRadius: 6,
    elevation: 4,
  },
  fieldImageContainer: {
    position: 'relative',
    height: 160, // Slightly taller image
    backgroundColor: '#EAEFF2', // Placeholder background
  },
  fieldImage: {
    width: '100%',
    height: '100%',
  },
  fieldOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 20, 40, 0.6)', // Darker overlay for contrast
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  fieldName: {
    color: 'white',
    fontSize: 20, // Larger field name
    fontWeight: 'bold',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.4)', // Text shadow for readability
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  fieldDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap', // Allow wrapping if location is long
  },
  fieldDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 4, // Allow spacing if wraps
  },
  fieldDetailText: {
    color: '#E0E0E0', // Lighter grey text
    fontSize: 14,
    marginLeft: 6,
  },
  // Weather Summary Section
  weatherSummary: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12, // Less padding at bottom
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334E68', // Dark blue-grey
    marginBottom: 16,
  },
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Use space-between for better alignment
    marginBottom: 12,
  },
  weatherItem: {
    alignItems: 'center',
    flex: 1, // Allow items to take equal space
    paddingHorizontal: 4, // Add slight horizontal padding
  },
   weatherValue: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: '700', // Bolder value
    color: '#102A43', // Very dark blue
  },
  weatherLabel: {
    fontSize: 10, // Smaller label
    color: '#627D98', // Medium blue-grey
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5, // Slight letter spacing
  },
  weatherDescription: {
      fontSize: 14,
      color: '#486581', // Darker description text
      textAlign: 'center',
      marginTop: 8,
  },
  weatherPlaceholder: {
      fontSize: 14,
      color: '#888',
      textAlign: 'center',
      paddingVertical: 15,
      fontStyle: 'italic',
  },
  // Loading & Error States
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 180,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginHorizontal: 16,
     shadowColor: '#405161',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#334E68',
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: 10,
  },
   loadingSubText: { // Added subtext style
    marginTop: 8,
    textAlign: 'center',
    color: '#627D98',
    fontSize: 13,
    paddingHorizontal: 10,
  },
  errorContainer: {
    marginHorizontal: 16,
    marginVertical: 24,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFF1F0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCCC7',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D93025',
    marginBottom: 10,
    marginTop: 8,
  },
  errorText: {
    textAlign: 'center',
    color: '#555',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  retryButton: {
    marginTop: 10, // Reduced margin
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#0062E6', // Adjusted blue
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
   // No Data state (when fetch succeeds but returns nothing)
   noDataContainer: {
    marginHorizontal: 16,
    marginVertical: 24,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
   },
   noDataText: {
     textAlign: 'center',
     color: '#667', // Slightly different grey
     fontSize: 15,
     marginTop: 12,
     marginBottom: 16,
     lineHeight: 22,
   },
  // Card Base Style
  cardBase: {
    marginHorizontal: 12, // Match field card horizontal margin
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 10, // Slightly less round
    padding: 16,
    shadowColor: '#405161',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18, // Larger section titles
    fontWeight: '700', // Bolder
    marginBottom: 16,
    color: '#102A43', // Very dark blue
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleIcon: {
      marginRight: 10, // Space between icon and text
  },
  // Specific Card Styles
  recommendationsCard: {},
  analysisCard: {},
  adviceCard: {},
  actionsCard: {},
  planCard: {
    marginBottom: 24, // Keep extra space at the bottom
  },
  // Crop Recommendation Item
  cropRecommendation: {
    marginBottom: 16,
    padding: 14,
    backgroundColor: '#F0F4F8', // Lighter grey-blue background
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#4A90E2', // Different blue accent
  },
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cropName: {
    fontSize: 17, // Slightly larger crop name
    fontWeight: '600',
    color: '#004488', // Darker blue for name
    flexShrink: 1, // Allow name to shrink
    marginRight: 8,
  },
  scoreChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  cropReason: {
    fontSize: 14,
    color: '#334E68',
    lineHeight: 21,
  },
  // Current Crop Analysis / Advice / Plan text style
  analysisText: {
    fontSize: 14,
    color: '#334E68',
    lineHeight: 21,
  },
  adviceText: {
    fontSize: 14,
    color: '#334E68',
    lineHeight: 21,
  },
  planText: {
    fontSize: 14,
    color: '#334E68',
    lineHeight: 21,
  },
  // Action Item
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center', // Align bullet vertically centered
    marginBottom: 12,
    paddingLeft: 4, // Indent action item slightly
  },
  actionBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
//  actionBulletText: { // Replaced with icon
//     color: 'white',
//     fontWeight: 'bold',
//     fontSize: 11,
//   },
  actionText: {
    flex: 1, // Take remaining space
    fontSize: 14,
    color: '#102A43', // Dark text for actions
    lineHeight: 21,
  },
   // Empty State (No field selected)
   emptyState: {
    flex: 1, // Ensure it takes full height
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
    padding: 24,
    backgroundColor: '#F4F7F9', // Match background
  },
  emptyStateText: {
    fontSize: 20, // Larger text
    fontWeight: '600',
    color: '#486581', // Softer grey-blue
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
   emptyStateSubText: {
    fontSize: 15,
    color: '#627D98', // Lighter grey-blue
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: '#0062E6', // Match retry button blue
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});


export default Plan;