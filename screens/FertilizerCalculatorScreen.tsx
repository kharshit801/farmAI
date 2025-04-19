// screens/FertilizerCalculatorScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Image,
  SafeAreaView,
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const FertilizerCalculatorScreen = () => {
    const router = useRouter();
    const [selectedCrop, setSelectedCrop] = useState('Potato');
  const [treeCount, setTreeCount] = useState('1');
  
  const decrementTrees = () => {
    const count = parseInt(treeCount);
    if (count > 1) {
      setTreeCount((count - 1).toString());
    }
  };
  
  const incrementTrees = () => {
    const count = parseInt(treeCount);
    setTreeCount((count + 1).toString());
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
  <Ionicons name="arrow-back" size={24} color="black" />
</TouchableOpacity>
          <Text style={styles.headerTitle}>Fertilizer Calculator</Text>
          <View style={styles.placeholderRight} />
        </View>
        
        {/* Crop Selector */}
        <View style={styles.contentSection}>
          <Text style={styles.infoText}>See relevant information on</Text>
          <TouchableOpacity style={styles.cropSelector}>
            <View style={styles.cropSelectorContent}>
              <Image 
                source={require('../assets/images/potato.png')} 
                style={styles.cropIcon} 
                defaultSource={require('../assets/images/potato.png')}
              />
              <Text style={styles.cropName}>{selectedCrop}</Text>
            </View>
            <Ionicons name="chevron-down" size={24} color="black" />
          </TouchableOpacity>
        </View>
        
        {/* Nutrient Section */}
        <View style={styles.nutrientSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.numberBadge}>
              <Text style={styles.numberBadgeText}>1</Text>
            </View>
            <Text style={styles.sectionTitle}>Nutrient quantities</Text>
            <TouchableOpacity style={styles.infoButton}>
              <Ionicons name="information-circle-outline" size={24} color="#777" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.nutrientDescription}>
            Based on your field size and crop, we've selected a nutrient ratio for you
          </Text>
          
          {/* Nutrient Cards */}
          <View style={styles.nutrientCardsContainer}>
            {/* Nitrogen */}
            <View style={styles.nutrientCard}>
              <Text style={styles.nutrientLabel}>N:</Text>
              <Text style={styles.nutrientValue}>400 g</Text>
              <Text style={styles.nutrientPerTree}>0.4 kg/tree</Text>
            </View>
            
            {/* Phosphorus */}
            <View style={styles.nutrientCard}>
              <Text style={styles.nutrientLabel}>P:</Text>
              <Text style={styles.nutrientValue}>200 g</Text>
              <Text style={styles.nutrientPerTree}>0.2 kg/tree</Text>
            </View>
            
            {/* Potassium */}
            <View style={styles.nutrientCard}>
              <Text style={styles.nutrientLabel}>K:</Text>
              <Text style={styles.nutrientValue}>400 g</Text>
              <Text style={styles.nutrientPerTree}>0.4 kg/tree</Text>
            </View>
          </View>
        </View>
        
        {/* Tree Counter */}
        <View style={styles.treeCountSection}>
          <Text style={styles.treeCountLabel}>Number of trees</Text>
          <View style={styles.treeCounter}>
            <TouchableOpacity 
              onPress={decrementTrees} 
              style={styles.counterButton}
            >
              <Text style={styles.counterButtonText}>−</Text>
            </TouchableOpacity>
            
            <View style={styles.treeCountInputContainer}>
              <TextInput
                style={styles.treeCountInput}
                value={treeCount}
                onChangeText={setTreeCount}
                keyboardType="number-pad"
                textAlign="center"
              />
              <Text style={styles.treeCountLabel}>Trees</Text>
            </View>
            
            <TouchableOpacity 
              onPress={incrementTrees} 
              style={styles.counterButton}
            >
              <Text style={styles.counterButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Calculate Button */}
        <TouchableOpacity style={styles.calculateButton}>
          <Text style={styles.calculateButtonText}>Calculate</Text>
        </TouchableOpacity>
        
        {/* Illustration */}
        <View style={styles.illustration}>
          <Image 
            source={require('../assets/images/potato.png')} 
            style={styles.illustrationImage}
            defaultSource={require('../assets/images/potato.png')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  placeholderRight: {
    width: 40,
  },
  contentSection: {
    padding: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  cropSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 25,
    padding: 12,
    backgroundColor: '#FFF',
  },
  cropSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cropIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '500',
  },
  nutrientSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2E7D58',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  infoButton: {
    padding: 4,
  },
  nutrientDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 16,
    lineHeight: 22,
  },
  nutrientCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutrientCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    width: '31%',
    alignItems: 'center',
  },
  nutrientLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  nutrientValue: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 4,
  },
  nutrientPerTree: {
    fontSize: 14,
    color: '#777',
  },
  treeCountSection: {
    padding: 16,
  },
  treeCountLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  treeCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E6EEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  treeCountInputContainer: {
    flex: 1,
    alignItems: 'center',
  },
  treeCountInput: {
    backgroundColor: '#F5F5F5',
    width: '80%',
    height: 50,
    borderRadius: 8,
    fontSize: 18,
    fontWeight: '500',
  },
  calculateButton: {
    backgroundColor: '#EAEAEA',
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
  },
  calculateButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#888',
  },
  illustration: {
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 40,
  },
  illustrationImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
  },
});

export default FertilizerCalculatorScreen;