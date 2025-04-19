// components/cards/MarketExplorerCard.tsx
import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../ui/Card';

interface MarketExplorerCardProps {
  title: string;
  imagePath: any;
  onPress?: () => void;
}

const MarketExplorerCard = ({ title, imagePath, onPress }: MarketExplorerCardProps) => {
  return (
    <Card onPress={onPress} style={styles.container}>
      <View style={styles.tagContainer}>
        <Ionicons name="cart-outline" size={20} color="#2E7D32" />
        <Text style={styles.tagText}>Explore market</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image source={imagePath} style={styles.image} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginVertical: 8,
  },
  tagContainer: {
    backgroundColor: '#E8F5E9',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tagText: {
    color: '#2E7D32',
    fontWeight: '600',
    marginLeft: 6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: 120,
    height: 120,
    marginRight: 16,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#001A33',
  },
});

export default MarketExplorerCard;