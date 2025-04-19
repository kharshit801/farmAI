// components/cards/FeatureCard.tsx
import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../ui/Card';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

interface FeatureCardProps {
  title: string;
  icon: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  badge?: number | null;
}

const FeatureCard = ({ title, icon, onPress, style, badge = null }: FeatureCardProps) => {
  return (
    <Card onPress={onPress} style={StyleSheet.flatten([styles.container, style])}>
      <View style={styles.iconContainer}>
        {icon}
        {badge !== null && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={wp('6%')} color="#003366" />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    width: '48%',
    height: hp('10%'),
  },
  iconContainer: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
    position: 'relative',
  },
  title: {
    color: '#001A33',
    fontWeight: '600',
    fontSize: wp('4%'),
    flex: 1,
    paddingRight: wp('8%'), // Add padding to prevent text overlap with arrow
  },
  arrowContainer: {
    position: 'absolute',
    right: wp('3%'),
    height: '100%',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -hp('0.6%'),
    right: -wp('1.2%'),
    backgroundColor: '#E53935',
    borderRadius: wp('2.5%'),
    width: wp('5%'),
    height: wp('5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: wp('3%'),
    fontWeight: 'bold',
  },
});

export default FeatureCard;