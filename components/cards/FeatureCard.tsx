// components/cards/FeatureCard.tsx
import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../ui/Card';

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
      <Ionicons name="chevron-forward" size={24} color="#003366" style={styles.arrow} />
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    width: '48%',
    height: 80,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  title: {
    color: '#001A33',
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
  },
  arrow: {
    position: 'absolute',
    right: 12,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#E53935',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default FeatureCard;