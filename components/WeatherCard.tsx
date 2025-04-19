import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
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
  };
  weather: {
    main: string;
    icon: string;
    description: string;
  }[];
  name: string;
};

const WeatherCard: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);

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

      // Fetch weather data using coordinates
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${location.coords.latitude}&lon=${location.coords.longitude}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch weather data');
      }
      
      const data: WeatherData = await response.json();
      setWeather(data);
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

  if (loading) {
    return (
      <View style={styles.weatherCard}>
        <ActivityIndicator size="large" color="#6A994E" />
      </View>
    );
  }

  if (error || !weather) {
    return (
      <TouchableOpacity style={styles.weatherCard} onPress={handleRefresh}>
        <Text style={styles.errorText}>{error || 'No weather data available'}</Text>
        <Text style={styles.tapToRetry}>Tap to retry</Text>
      </TouchableOpacity>
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
  );
};

const styles = StyleSheet.create({
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
  }
});

export default WeatherCard;