// components/sections/FeatureCardsSection.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Import useRouter instead of useNavigation
import FeatureCard from '../cards/FeatureCard';
import FieldProfitCard from '../cards/FieldProfitCard';
import MarketExplorerCard from '../cards/MarketExplorerCard';

const FeatureCardsSection = () => {
  const router = useRouter(); // Use Expo Router's useRouter hook
  
  return (
    <View style={styles.container}>
      {/* First row */}
      <View style={styles.row}>
        <FeatureCard 
          title="Fertilizer calculator"
          icon={<FontAwesome5 name="leaf" size={24} color="#003366" />}
          onPress={() => router.push('/fertilizer-calculator')} // Use router.push with the path
        />
        <FeatureCard 
          title="Pests & diseases"
          icon={<MaterialCommunityIcons name="bug-outline" size={24} color="#003366" />}
          onPress={() => console.log('Pests & diseases pressed')}
        />
      </View>
      
      {/* Second row */}
      <View style={styles.row}>
        <FeatureCard 
          title="Cultivation Tips"
          icon={<MaterialCommunityIcons name="shovel" size={24} color="#003366" />}
          onPress={() => console.log('Cultivation tips pressed')}
        />
        <FeatureCard 
          title="Pests and Disease Alert"
          icon={<Ionicons name="warning-outline" size={24} color="#003366" />}
          badge={9}
          onPress={() => console.log('Alerts pressed')}
        />
      </View>
      
      {/* Field profit estimation */}
      <FieldProfitCard 
        amount="0"
        currency="₹"
        onPress={() => console.log('Field profit pressed')}
      />
      
      {/* Market explorer */}
      <MarketExplorerCard 
        title="Good prices for agri-inputs"
        imagePath={require('../../assets/images/profile_placeholder.png')}
        onPress={() => console.log('Market explorer pressed')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});

export default FeatureCardsSection;