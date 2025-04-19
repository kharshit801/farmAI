import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// API key
const OPENWEATHERMAP_API_KEY = '5942ca62c79ba3159881b814558fb0ae';

type WeatherData = {
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
    humidity?: number;
  };
  weather: {
    main: string;
    icon: string;
    description: string;
  }[];
  name: string;
  wind?: {
    speed?: number;
  };
};

type SprayingRecommendation = {
  recommendation: string;
  suitability: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Not Recommended';
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  startTime?: string;
  endTime?: string;
  details: string;
};

const WeatherCard: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<SprayingRecommendation | null>(null);

  const getLocationAndWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Location permission is required to get weather data');
        setLoading(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Get location name (reverse geocoding)
      const geoLocation = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geoLocation && geoLocation.length > 0) {
        const city = geoLocation[0].city || geoLocation[0].subregion || geoLocation[0].district;
        if (city) setLocationName(city);
      }

      // Fetch weather data using coordinates - requesting additional data
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${location.coords.latitude}&lon=${location.coords.longitude}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch weather data');
      }
      
      const data: WeatherData = await response.json();
      setWeather(data);
      
      // Analyze spraying conditions based on weather data
      analyzeSprayingConditions(data);
    } catch (err) {
      console.error('Weather API Error:', err);
      setError(err instanceof Error ? err.message : 'Unable to load weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocationAndWeather();
  }, []);

  const handleRefresh = () => {
    getLocationAndWeather();
  };

  const getWeatherIcon = (condition: string): keyof typeof Ionicons.glyphMap => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return 'sunny';
      case 'clouds':
        return 'cloud';
      case 'rain':
        return 'rainy';
      case 'drizzle':
        return 'rainy';
      case 'thunderstorm':
        return 'thunderstorm';
      case 'snow':
        return 'snow';
      case 'mist':
      case 'fog':
      case 'haze':
        return 'cloud-outline';
      default:
        return 'partly-sunny';
    }
  };

  const analyzeSprayingConditions = (data: WeatherData) => {
    // Extract relevant weather data
    const temp = data.main.temp;
    const condition = data.weather[0].main.toLowerCase();
    const humidity = data.main.humidity || 50; // Default if not available
    const windSpeed = data.wind?.speed || 0; // Default if not available

    // Initialize recommendation
    let newRecommendation: SprayingRecommendation = {
      recommendation: '',
      suitability: 'Poor',
      icon: 'alert-circle',
      color: '#EF4444', // Red for poor conditions
      details: ''
    };

    // Temperature analysis
    if (temp < 10) {
      newRecommendation.suitability = 'Not Recommended';
      newRecommendation.recommendation = 'Too cold for spraying';
      newRecommendation.icon = 'snow';
      newRecommendation.color = '#6B7280'; // Gray
      newRecommendation.details = 'Low temperatures reduce chemical efficacy';
    } else if (temp > 30) {
      newRecommendation.suitability = 'Poor';
      newRecommendation.recommendation = 'Too hot for optimal spraying';
      newRecommendation.icon = 'thermometer';
      newRecommendation.color = '#EF4444'; // Red
      newRecommendation.details = 'Chemical evaporation risk is high';
    } else if (temp >= 10 && temp <= 25) {
      // Wind conditions
      if (windSpeed > 15) {
        newRecommendation.suitability = 'Not Recommended';
        newRecommendation.recommendation = 'Wind too strong for spraying';
        newRecommendation.icon = 'speedometer';
        newRecommendation.color = '#6B7280'; // Gray
        newRecommendation.details = 'High drift risk, wait for calmer conditions';
      } 
      // Weather conditions
      else if (['rain', 'drizzle', 'thunderstorm'].includes(condition)) {
        newRecommendation.suitability = 'Not Recommended';
        newRecommendation.recommendation = 'Rainfall prevents effective spraying';
        newRecommendation.icon = 'rainy';
        newRecommendation.color = '#6B7280'; // Gray
        newRecommendation.details = 'Rain will wash away chemicals';
      } else if (humidity < 40) {
        newRecommendation.suitability = 'Fair';
        newRecommendation.recommendation = 'Low humidity may affect spray';
        newRecommendation.icon = 'water-outline';
        newRecommendation.color = '#F59E0B'; // Amber
        newRecommendation.details = 'Consider early morning application';
        newRecommendation.startTime = '6:00 AM';
        newRecommendation.endTime = '9:00 AM';
      } else if (windSpeed <= 10 && humidity >= 40 && humidity <= 80) {
        newRecommendation.suitability = 'Excellent';
        newRecommendation.recommendation = 'Ideal conditions for spraying';
        newRecommendation.icon = 'checkmark-circle';
        newRecommendation.color = '#10B981'; // Green
        newRecommendation.details = 'Optimal temperature and humidity';
        
        // Set recommended time window based on temperature
        if (temp < 15) {
          newRecommendation.startTime = '10:00 AM';
          newRecommendation.endTime = '4:00 PM';
        } else {
          newRecommendation.startTime = '6:00 AM';
          newRecommendation.endTime = '10:00 AM';
        }
      } else {
        newRecommendation.suitability = 'Good';
        newRecommendation.recommendation = 'Good conditions for spraying';
        newRecommendation.icon = 'thumbs-up';
        newRecommendation.color = '#3B82F6'; // Blue
        newRecommendation.startTime = '6:00 AM';
        newRecommendation.endTime = '11:00 AM';
        newRecommendation.details = 'Acceptable wind and humidity levels';
      }
    } else {
      // Default for other temperature ranges (25-30°C)
      newRecommendation.suitability = 'Fair';
      newRecommendation.recommendation = 'Consider early morning spraying';
      newRecommendation.icon = 'time-outline';
      newRecommendation.color = '#F59E0B'; // Amber
      newRecommendation.startTime = '6:00 AM';
      newRecommendation.endTime = '9:00 AM';
      newRecommendation.details = 'Spray early to avoid heat of the day';
    }

    setRecommendation(newRecommendation);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.weatherCard}>
          <ActivityIndicator size="large" color="#6A994E" />
        </View>
      </View>
    );
  }

  if (error || !weather) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.weatherCard} onPress={handleRefresh}>
          <Text style={styles.errorText}>{error || 'No weather data available'}</Text>
          <Text style={styles.tapToRetry}>Tap to retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });
  
  const temp = Math.round(weather.main.temp);
  const tempMin = Math.round(weather.main.temp_min);
  const tempMax = Math.round(weather.main.temp_max);
  const condition = weather.weather[0].main;
  const icon = getWeatherIcon(condition);
  const displayLocation = locationName || weather.name;

  return (
    <View style={styles.container}>
      {/* Weather Card */}
      <TouchableOpacity style={styles.weatherCard} onPress={handleRefresh}>
        <View>
          <Text style={styles.locationText}>{displayLocation}, {currentDate}</Text>
          <Text style={styles.weatherDetails}>{condition} • {tempMin}°C / {tempMax}°C</Text>
        </View>
        <View style={styles.temperatureContainer}>
          <Text style={styles.temperatureText}>{temp}°C</Text>
          <Ionicons name={icon} size={wp('8%')} color="#FFD700" />
        </View>
      </TouchableOpacity>

      {/* Field Spraying Card */}
      {recommendation && (
        <View style={styles.sprayingCard}>
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>Field Spraying</Text>
              <View style={[styles.suitabilityBadge, { backgroundColor: recommendation.color }]}>
                <Text style={styles.suitabilityText}>{recommendation.suitability}</Text>
              </View>
            </View>
            <Ionicons name={recommendation.icon} size={wp('8%')} color={recommendation.color} />
          </View>
          
          <Text style={styles.recommendationText}>{recommendation.recommendation}</Text>
          
          {(recommendation.startTime && recommendation.endTime) && (
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={wp('4%')} color="#6B7280" style={styles.timeIcon} />
              <Text style={styles.timeText}>Best time: {recommendation.startTime} - {recommendation.endTime}</Text>
            </View>
          )}
          
          <Text style={styles.detailsText}>{recommendation.details}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  weatherCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: wp('4%'),
    padding: wp('4%'),
    borderRadius: wp('4%'),
    marginBottom: hp('1%'),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  locationText: {
    fontSize: wp('4.5%'),
    fontWeight: '600',
    color: '#111827',
  },
  weatherDetails: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
    marginTop: hp('0.5%'),
  },
  temperatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  temperatureText: {
    fontSize: wp('5.5%'),
    fontWeight: 'bold',
    color: '#111827',
    marginRight: wp('2%'),
  },
  errorText: {
    fontSize: wp('4%'),
    color: '#B91C1C',
    flex: 1,
  },
  tapToRetry: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
    marginTop: hp('0.5%'),
  },
  // Spraying Card Styles
  sprayingCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: wp('4%'),
    padding: wp('4%'),
    borderRadius: wp('4%'),
    marginTop: hp('1%'),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: wp('4.5%'),
    fontWeight: '600',
    color: '#111827',
    marginRight: wp('2%'),
  },
  suitabilityBadge: {
    paddingHorizontal: wp('2%'),
    paddingVertical: wp('0.5%'),
    borderRadius: wp('2%'),
  },
  suitabilityText: {
    color: '#FFFFFF',
    fontSize: wp('3%'),
    fontWeight: '600',
  },
  recommendationText: {
    fontSize: wp('4%'),
    fontWeight: '500',
    color: '#111827',
    marginTop: hp('1%'),
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('1%'),
  },
  timeIcon: {
    marginRight: wp('1%'),
  },
  timeText: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
  },
  detailsText: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
    marginTop: hp('1%'),
  },
  noDataText: {
    fontSize: wp('4%'),
    color: '#6B7280',
    textAlign: 'center',
  }
});

export default WeatherCard;