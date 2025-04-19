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
import { useField } from '../context/fieldcontext';
import { calculateCenter } from './../components/utils/Cropservice';

// --- Constants ---
const JULEP_API_KEY = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTAxNTkwMTcsImlhdCI6MTc0NDk3NTAxNywic3ViIjoiNjVhMWE5MzYtYjBlMy01OTI0LTk3NzQtNjU1NDVmYmYwNTgyIn0.QbU03Bwv5Qv4Wv5sKuXu26wE9vac0lguHwKlUfzVeLvwVY1-UlMT7kr3h8K6XQEQJUn925NB5OD4uLR0jPHRAQ"; // Move to .env in production
const JULEP_AGENT_ID = "06802005-adc9-75f1-8000-5ea756eb8532";
const JULEP_API_URL = "https://api.julep.ai/api/chat";
const OPENWEATHER_API_KEY = "5942ca62c79ba3159881b814558fb0ae";
const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";

// --- Interfaces ---
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

interface DiseaseRisk {
  disease: string;
  riskLevel: string;
  prevention: string;
}

interface AIRecommendation {
  recommendedCrops: CropRecommendation[];
  currentCropAnalysis: string;
  cultivationAdvice: string;
  immediateActions: string[];
  longTermPlan: string;
  diseaseRisks: DiseaseRisk[];
  additionalAdvice: string;
}

// --- Component ---
const Plan = () => {
  const router = useRouter();
  const { selectedField, setSelectedField } = useField();
  const [recommendations, setRecommendations] = useState<AIRecommendation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const isMounted = useRef<boolean>(true);
  const abortController = useRef<AbortController | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
  }, []);

  // Fetch weather data
  const fetchWeatherData = useCallback(async (center: { latitude: number; longitude: number }) => {
    abortController.current = new AbortController();
    try {
      const weatherUrl = `${WEATHER_API_URL}?lat=${center.latitude}&lon=${center.longitude}&units=metric&appid=${OPENWEATHER_API_KEY}`;
      const weatherResponse = await fetch(weatherUrl, {
        signal: abortController.current?.signal,
      });

      if (!weatherResponse.ok) {
        throw new Error(`Weather API error: ${weatherResponse.status} ${weatherResponse.statusText}`);
      }

      const weatherDataRaw = await weatherResponse.json();
      return {
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
          uvi: 0,
        },
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return null;
      }
      console.error('Weather fetch error:', err);
      return null;
    }
  }, []);

  // Fetch AI recommendations with Julep API
  const fetchRecommendations = useCallback(
    async (weatherData: Weather, inputData: any, retries = 2): Promise<AIRecommendation | null> => {
      abortController.current = new AbortController();
      try {
        // Validate input data
        const validatedData = {
          location: inputData.location || 'Unknown Location',
          currentTemp: inputData.currentTemp ?? 25,
          humidity: inputData.humidity ?? 50,
          precipitation: inputData.precipitation ?? 0,
          windSpeed: inputData.windSpeed ?? 0,
          weatherDescription: inputData.weatherDescription || 'Clear',
          area: inputData.area ?? 1,
          currentCrop: inputData.currentCrop || 'None',
        };

        const prompt = `
You are an expert agricultural advisor. Using the provided field location and weather data, generate a comprehensive agricultural plan to maximize crop production for a field in ${validatedData.location}. The plan should include crop recommendations, strategies to optimize yield, potential disease risks, and additional advice for sustainable farming.

**Input Data**:
- Location: ${validatedData.location}
- Temperature: ${validatedData.currentTemp}°C
- Humidity: ${validatedData.humidity}%
- Precipitation: ${validatedData.precipitation} mm
- Wind Speed: ${validatedData.windSpeed} m/s
- Weather Condition: ${validatedData.weatherDescription}
- Field Area: ${validatedData.area} Acres
- Current Crop: ${validatedData.currentCrop}

**Requirements**:
- Recommend at least two crops best suited for the location and current weather conditions.
- Provide practical strategies to maximize production (e.g., irrigation, fertilization, planting techniques).
- Identify at least two potential disease risks for the recommended crops and suggest prevention methods.
- Offer additional advice (e.g., soil management, pest control, crop rotation) for sustainable farming.

**Output Format**:
Return a JSON object in this exact format:
{
  "recommendedCrops": [
    {
      "name": "Crop Name",
      "suitabilityScore": "Score/10",
      "reason": "Reason based on location, weather, and field conditions"
    },
    {
      "name": "Crop Name",
      "suitabilityScore": "Score/10",
      "reason": "Reason based on location, weather, and field conditions"
    }
  ],
  "currentCropAnalysis": "Analysis of current crop's suitability or 'N/A' if none",
  "cultivationAdvice": "Practical strategies to maximize production under current conditions",
  "immediateActions": [
    "Action 1 based on current conditions",
    "Action 2 if applicable"
  ],
  "longTermPlan": "Long-term suggestions for sustainable farming and yield improvement",
  "diseaseRisks": [
    {
      "disease": "Disease Name",
      "riskLevel": "Low/Medium/High",
      "prevention": "Prevention methods"
    },
    {
      "disease": "Disease Name",
      "riskLevel": "Low/Medium/High",
      "prevention": "Prevention methods"
    }
  ],
  "additionalAdvice": "Additional tips for soil management, pest control, or other relevant practices"
}

Ensure all advice is realistic, specific, and tailored to the input data. Provide at least two crop recommendations and two disease risks.
        `;

        const response = await fetch(JULEP_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${JULEP_API_KEY}`,
          },
          body: JSON.stringify({
            agent_id: JULEP_AGENT_ID,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            response_format: { type: 'json_object' },
          }),
          signal: abortController.current?.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Julep API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Julep API raw response:', data);

        let responseText = data.choices[0]?.message?.content || '{}';
        if (typeof responseText === 'object') {
          responseText = JSON.stringify(responseText);
        }

        // Robust response parsing
        let cleanedResponse = responseText.trim();
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.substring(7, cleanedResponse.length - 3).trim();
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.substring(3, cleanedResponse.length - 3).trim();
        }

        // Validate JSON
        let parsedResponse: AIRecommendation;
        try {
          parsedResponse = JSON.parse(cleanedResponse);
        } catch (parseError) {
          console.error('JSON parse error:', parseError, 'Response:', cleanedResponse);
          throw new Error(`Failed to parse Julep API response: ${parseError}`);
        }
        console.log('Parsed Julep response:', parsedResponse);

        // Relaxed response validation
        parsedResponse.recommendedCrops = parsedResponse.recommendedCrops?.length
          ? parsedResponse.recommendedCrops
          : [
              { name: 'Unknown Crop', suitabilityScore: 'N/A', reason: 'No crop data provided' },
              { name: 'Unknown Crop', suitabilityScore: 'N/A', reason: 'No crop data provided' },
            ];
        parsedResponse.currentCropAnalysis = parsedResponse.currentCropAnalysis || 'N/A';
        parsedResponse.cultivationAdvice = parsedResponse.cultivationAdvice || 'No cultivation advice available.';
        parsedResponse.immediateActions = parsedResponse.immediateActions?.length
          ? parsedResponse.immediateActions
          : ['No immediate actions specified.'];
        parsedResponse.longTermPlan = parsedResponse.longTermPlan || 'No long-term plan available.';
        parsedResponse.diseaseRisks = parsedResponse.diseaseRisks?.length
          ? parsedResponse.diseaseRisks
          : [
              { disease: 'Unknown Disease', riskLevel: 'N/A', prevention: 'No prevention data provided' },
              { disease: 'Unknown Disease', riskLevel: 'N/A', prevention: 'No prevention data provided' },
            ];
        parsedResponse.additionalAdvice = parsedResponse.additionalAdvice || 'No additional advice available.';

        return parsedResponse;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return null;
        }
        console.error(`Recommendation fetch error (attempt ${3 - retries}):`, err);

        // Retry logic
        if (retries > 0) {
          console.log(`Retrying recommendation fetch (${retries} attempts left)...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return fetchRecommendations(weatherData, inputData, retries - 1);
        }

        // Fallback response
        setError(`Failed to fetch recommendations: ${err.message}. Using fallback data.`);
        return {
          recommendedCrops: [
            {
              name: 'Rice',
              suitabilityScore: '8/10',
              reason: 'Suitable for warm, humid conditions in Prayagraj with adequate irrigation.',
            },
            {
              name: 'Wheat',
              suitabilityScore: '7/10',
              reason: 'Adaptable to clear weather and moderate temperatures in Prayagraj.',
            },
          ],
          currentCropAnalysis: 'Banana is suitable but requires consistent irrigation and pest monitoring.',
          cultivationAdvice: 'Use drip irrigation and apply nitrogen-rich fertilizers to support crop growth.',
          immediateActions: ['Test soil pH and nutrient levels', 'Ensure proper irrigation setup'],
          longTermPlan: 'Implement crop rotation with legumes to maintain soil fertility.',
          diseaseRisks: [
            {
              disease: 'Fusarium Wilt',
              riskLevel: 'Medium',
              prevention: 'Use resistant banana varieties and rotate crops.',
            },
            {
              disease: 'Leaf Spot',
              riskLevel: 'Low',
              prevention: 'Apply fungicides and maintain field hygiene.',
            },
          ],
          additionalAdvice: 'Monitor for pests like aphids and consider integrated pest management.',
        };
      }
    },
    []
  );

  // Debounced fetch function
  const debounceFetch = useCallback(() => {
    cleanup();
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(async () => {
      if (!isMounted.current) return;

      if (!selectedField || !selectedField.coordinates || selectedField.coordinates.length === 0) {
        setError('Field data is incomplete or missing coordinates.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!refreshing) {
        setLoading(true);
      }
      setError(null);

      // Log input data for debugging
      console.log('Selected Field:', selectedField);

      // Fetch Weather Data
      const center = calculateCenter(selectedField.coordinates);
      if (!center || typeof center.latitude !== 'number' || typeof center.longitude !== 'number') {
        setError('Invalid center coordinates calculated.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const weatherData = await fetchWeatherData(center);
      if (!weatherData) {
        setError('Failed to fetch weather data. Please check your API key or network connection.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      console.log('Weather Data:', weatherData);

      if (isMounted.current) {
        setSelectedField({
          ...selectedField,
          weather: weatherData,
        });
      } else {
        return;
      }

      // Fetch AI Recommendations
      try {
        const inputData = {
          location: selectedField.location || 'Unknown',
          currentTemp: weatherData.current.temp,
          feelsLikeTemp: weatherData.current.feels_like,
          humidity: weatherData.current.humidity,
          precipitation: weatherData.current.precipitation,
          windSpeed: weatherData.current.wind_speed,
          cloudCover: weatherData.current.clouds,
          weatherDescription: weatherData.current.weather.description,
          currentCrop: selectedField.crop || 'None',
          area: selectedField.area || 1,
        };

        console.log('Input Data for Julep API:', inputData);

        const recommendationResult = await fetchRecommendations(weatherData, inputData);
        if (recommendationResult && isMounted.current) {
          setRecommendations(recommendationResult);
          setError(null);
        } else if (isMounted.current) {
          setError('Failed to fetch AI recommendations. Please try again.');
        }
      } catch (err: any) {
        if (isMounted.current) {
          console.error('Recommendation fetch error:', err);
          setError(`AI analysis failed: ${err.message}. Please check your API key or network connection.`);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }, 500);
  }, [selectedField, setSelectedField, refreshing, cleanup, fetchWeatherData, fetchRecommendations]);

  // Initialize and fetch data
  useEffect(() => {
    isMounted.current = true;
    if (selectedField) {
      debounceFetch();
    } else if (isMounted.current) {
      setError('No field selected');
      setLoading(false);
      setRecommendations(null);
    }

    return () => {
      isMounted.current = false;
      cleanup();
    };
  }, [selectedField, debounceFetch, cleanup]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (selectedField) {
      debounceFetch();
    } else {
      setError('No field selected to refresh');
      setRefreshing(false);
    }
  }, [selectedField, debounceFetch]);

  // Render Logic
  if (!selectedField) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Field Planning' }} />
        <ScrollView contentContainerStyle={styles.emptyState}>
          <Ionicons name="leaf-outline" size={60} color="#cccccc" />
          <Text style={styles.emptyStateText}>No Field Selected</Text>
          <Text style={styles.emptyStateSubText}>Go to the 'Fields' tab and choose a field to view planning advice.</Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={() => router.push('/fields')}>
            <Text style={styles.emptyStateButtonText}>Select a Field</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: `Plan: ${selectedField.name}` }} />
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0055FF" colors={['#0055FF']} />}
      >
        {/* Field Summary Card */}
        <View style={styles.fieldSummaryCard}>
          <View style={styles.fieldImageContainer}>
            <Image
              source={selectedField.image || require('../assets/images/fieldimage.jpg')}
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
                  <Text style={styles.fieldDetailText} numberOfLines={1} ellipsizeMode="tail">
                    {selectedField.location}
                  </Text>
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
                    <Ionicons name="thermometer" size={16} color="#FF8C00" />
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
                  {selectedField.weather.current.weather.description.charAt(0).toUpperCase() +
                    selectedField.weather.current.weather.description.slice(1)}
                  {` (Feels like ${selectedField.weather.current.feels_like.toFixed(1)}°C)`}
                </Text>
              </>
            ) : loading && !error ? (
              <View style={styles.centeredContent}>
                <ActivityIndicator size="small" color="#0055FF" />
                <Text style={styles.inlineLoadingText}>Fetching weather...</Text>
              </View>
            ) : (
              <Text style={styles.weatherPlaceholder}>Weather data unavailable.</Text>
            )}
          </View>
        </View>

        {/* AI Recommendations Section */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0055FF" />
            <Text style={styles.loadingText}>Analyzing field conditions and generating recommendations...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={40} color="#FF3B30" />
            <Text style={styles.errorTitle}>Analysis Failed</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <MaterialIcons name="refresh" size={18} color="white" style={{ marginRight: 5 }} />
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
                  <Ionicons name="stats-chart-outline" size={20} color="#4682B4" style={styles.sectionTitleIcon} /> Current Crop:{' '}
                  {selectedField.crop}
                </Text>
                <Text style={styles.analysisText}>{recommendations.currentCropAnalysis}</Text>
              </View>
            )}

            {/* Cultivation Advice Card */}
            {recommendations.cultivationAdvice && (
              <View style={[styles.cardBase, styles.adviceCard]}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="build-outline" size={20} color="#DAA520" style={styles.sectionTitleIcon} /> Production Strategies
                </Text>
                <Text style={styles.adviceText}>{recommendations.cultivationAdvice}</Text>
              </View>
            )}

            {/* Disease Risks Card */}
            {recommendations.diseaseRisks && recommendations.diseaseRisks.length > 0 && (
              <View style={[styles.cardBase, styles.diseaseCard]}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="warning-outline" size={20} color="#FF4500" style={styles.sectionTitleIcon} /> Disease Risks
                </Text>
                {recommendations.diseaseRisks.map((risk, index) => (
                  <View key={`disease-${index}`} style={styles.diseaseItem}>
                    <View style={styles.diseaseHeader}>
                      <Text style={styles.diseaseName}>{risk.disease || 'Unknown Disease'}</Text>
                      <View
                        style={[
                          styles.riskChip,
                          { backgroundColor: risk.riskLevel === 'High' ? '#FF4500' : risk.riskLevel === 'Medium' ? '#FFA500' : '#4CAF50' },
                        ]}
                      >
                        <Text style={styles.riskText}>{risk.riskLevel}</Text>
                      </View>
                    </View>
                    <Text style={styles.diseasePrevention}>{risk.prevention || 'No prevention provided.'}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Immediate Actions Card */}
            {recommendations.immediateActions && recommendations.immediateActions.length > 0 && (
              <View style={[styles.cardBase, styles.actionsCard]}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="flash-outline" size={20} color="#FF4500" style={styles.sectionTitleIcon} /> Immediate Actions
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

            {/* Additional Advice Card */}
            {recommendations.additionalAdvice && (
              <View style={[styles.cardBase, styles.additionalCard]}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="information-circle-outline" size={20} color="#4682B4" style={styles.sectionTitleIcon} /> Additional Advice
                </Text>
                <Text style={styles.additionalText}>{recommendations.additionalAdvice}</Text>
              </View>
            )}

            {/* Long Term Strategy Card */}
            {recommendations.longTermPlan && (
              <View style={[styles.cardBase, styles.planCard]}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="calendar-clear-outline" size={20} color="#8A2BE2" style={styles.sectionTitleIcon} /> Long Term Strategy
                </Text>
                <Text style={styles.planText}>{recommendations.longTermPlan}</Text>
              </View>
            )}
          </>
        ) : (
          !loading &&
          !error && (
            <View style={styles.noDataContainer}>
              <Ionicons name="information-circle-outline" size={40} color="#cccccc" />
              <Text style={styles.noDataText}>No planning information available.</Text>
              <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                <MaterialIcons name="refresh" size={18} color="white" style={{ marginRight: 5 }} />
                <Text style={styles.retryButtonText}>Try Refreshing</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F9',
  },
  scrollViewContent: {
    paddingBottom: 32,
    flexGrow: 1,
  },
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
  fieldSummaryCard: {
    marginHorizontal: 12,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#405161',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  fieldImageContainer: {
    position: 'relative',
    height: 160,
    backgroundColor: '#EAEFF2',
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
    backgroundColor: 'rgba(0, 20, 40, 0.6)',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  fieldName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  fieldDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  fieldDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 4,
  },
  fieldDetailText: {
    color: '#E0E0E0',
    fontSize: 14,
    marginLeft: 6,
  },
  weatherSummary: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334E68',
    marginBottom: 16,
  },
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weatherItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  weatherValue: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: '700',
    color: '#102A43',
  },
  weatherLabel: {
    fontSize: 10,
    color: '#627D98',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weatherDescription: {
    fontSize: 14,
    color: '#486581',
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
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#0062E6',
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
    color: '#667',
    fontSize: 15,
    marginTop: 12,
    marginBottom: 16,
    lineHeight: 22,
  },
  cardBase: {
    marginHorizontal: 12,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#405161',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#102A43',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleIcon: {
    marginRight: 10,
  },
  recommendationsCard: {},
  analysisCard: {},
  adviceCard: {},
  actionsCard: {},
  diseaseCard: {},
  additionalCard: {},
  planCard: {
    marginBottom: 24,
  },
  cropRecommendation: {
    marginBottom: 16,
    padding: 14,
    backgroundColor: '#F0F4F8',
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#4A90E2',
  },
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cropName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#004488',
    flexShrink: 1,
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
  diseaseItem: {
    marginBottom: 16,
    padding: 14,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#FF6B6B',
  },
  diseaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  diseaseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D93025',
    flexShrink: 1,
    marginRight: 8,
  },
  riskChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  diseasePrevention: {
    fontSize: 14,
    color: '#334E68',
    lineHeight: 21,
  },
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
  additionalText: {
    fontSize: 14,
    color: '#334E68',
    lineHeight: 21,
  },
  planText: {
    fontSize: 14,
    color: '#334E68',
    lineHeight: 21,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 4,
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
  actionText: {
    flex: 1,
    fontSize: 14,
    color: '#102A43',
    lineHeight: 21,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F4F7F9',
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#486581',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyStateSubText: {
    fontSize: 15,
    color: '#627D98',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: '#0062E6',
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