import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// Types matching your weather component
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

type SprayingCardProps = {
  weatherData: WeatherData | null;
};

const SprayingTimeCard: React.FC<SprayingCardProps> = ({ weatherData }) => {
  const [recommendation, setRecommendation] = useState<SprayingRecommendation | null>(null);

  useEffect(() => {
    if (weatherData) {
      analyzeSprayingConditions(weatherData);
    }
  }, [weatherData]);

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

  if (!weatherData || !recommendation) {
    return (
      <View style={styles.sprayingCard}>
        <Text style={styles.noDataText}>Unable to analyze spraying conditions</Text>
      </View>
    );
  }

  return (
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
  );
};

const styles = StyleSheet.create({
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

export default SprayingTimeCard;