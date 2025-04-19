import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const FertilizerCalculatorScreen = () => {
  const router = useRouter();
  const [selectedCrop, setSelectedCrop] = useState('Potato');
  const [treeCount, setTreeCount] = useState('1');

  // Animation states for buttons
  const cropSelectorScale = useSharedValue(1);
  const decrementScale = useSharedValue(1);
  const incrementScale = useSharedValue(1);
  const calculateScale = useSharedValue(1);

  // Animation handlers
  const handlePressIn = (scale: Animated.SharedValue<number>) => {
    scale.value = withSpring(0.98);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = (scale: Animated.SharedValue<number>) => {
    scale.value = withSpring(1);
  };

  // Animated styles
  const cropSelectorAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cropSelectorScale.value }],
  }));

  const decrementAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: decrementScale.value }],
  }));

  const incrementAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: incrementScale.value }],
  }));

  const calculateAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: calculateScale.value }],
  }));

  // Tree count handlers
  const decrementTrees = () => {
    const count = parseInt(treeCount);
    if (count > 1) {
      setTreeCount((count - 1).toString());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const incrementTrees = () => {
    const count = parseInt(treeCount);
    setTreeCount((count + 1).toString());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={wp('6%')} color="#1F1F1F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fertilizer Calculator</Text>
          <View style={styles.placeholderRight} />
        </View>

        {/* Illustration */}
        <View style={styles.illustration}>
          <Image
            source={require('../assets/images/potato.png')}
            style={styles.illustrationImage}
            defaultSource={require('../assets/images/potato.png')}
          />
        </View>

        {/* Crop Selector */}
        <View style={styles.contentSection}>
          <Text style={styles.infoText}>Select your crop</Text>
          <Animated.View style={[styles.cropSelectorWrapper, cropSelectorAnimatedStyle]}>
            <TouchableOpacity
              style={styles.cropSelector}
              onPress={() => {} /* Add crop selection logic */}
              onPressIn={() => handlePressIn(cropSelectorScale)}
              onPressOut={() => handlePressOut(cropSelectorScale)}
            >
              <View style={styles.cropSelectorContent}>
                <Image
                  source={require('../assets/images/potato.png')}
                  style={styles.cropIcon}
                  defaultSource={require('../assets/images/potato.png')}
                />
                <Text style={styles.cropName}>{selectedCrop}</Text>
              </View>
              <Ionicons name="chevron-down" size={wp('6%')} color="#1F1F1F" />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Nutrient Section */}
        <View style={styles.nutrientSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.numberBadge}>
              <Text style={styles.numberBadgeText}>1</Text>
            </View>
            <Text style={styles.sectionTitle}>Nutrient Quantities</Text>
            <TouchableOpacity style={styles.infoButton}>
              <Ionicons name="information-circle-outline" size={wp('6%')} color="#6A994E" />
            </TouchableOpacity>
          </View>

          <Text style={styles.nutrientDescription}>
            Based on your field size and crop, we've selected a nutrient ratio for you.
          </Text>

          {/* Nutrient Cards */}
          <View style={styles.nutrientCardsContainer}>
            {[
              { label: 'N', value: '400 g', perTree: '0.4 kg/tree' },
              { label: 'P', value: '200 g', perTree: '0.2 kg/tree' },
              { label: 'K', value: '400 g', perTree: '0.4 kg/tree' },
            ].map((nutrient, index) => (
              <View key={index} style={styles.nutrientCard}>
                <Text style={styles.nutrientLabel}>{nutrient.label}:</Text>
                <Text style={styles.nutrientValue}>{nutrient.value}</Text>
                <Text style={styles.nutrientPerTree}>{nutrient.perTree}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tree Counter */}
        <View style={styles.treeCountSection}>
          <Text style={styles.treeCountLabel}>Number of Trees</Text>
          <View style={styles.treeCounter}>
            <Animated.View style={[styles.counterButtonWrapper, decrementAnimatedStyle]}>
              <TouchableOpacity
                style={[styles.counterButton, { backgroundColor: '#1F1F1F' }]}
                onPress={decrementTrees}
                onPressIn={() => handlePressIn(decrementScale)}
                onPressOut={() => handlePressOut(decrementScale)}
                disabled={parseInt(treeCount) <= 1}
              >
                <Text style={styles.counterButtonText}>−</Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.treeCountInputContainer}>
              <TextInput
                style={styles.treeCountInput}
                value={treeCount}
                onChangeText={setTreeCount}
                keyboardType="number-pad"
                textAlign="center"
              />
              <Text style={styles.treeCountInputLabel}>Trees</Text>
            </View>

            <Animated.View style={[styles.counterButtonWrapper, incrementAnimatedStyle]}>
              <TouchableOpacity
                style={[styles.counterButton, { backgroundColor: '#1F1F1F' }]}
                onPress={incrementTrees}
                onPressIn={() => handlePressIn(incrementScale)}
                onPressOut={() => handlePressOut(incrementScale)}
              >
                <Text style={styles.counterButtonText}>+</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Calculate Button */}
        <Animated.View style={[styles.calculateButtonWrapper, calculateAnimatedStyle]}>
          <TouchableOpacity
            style={styles.calculateButton}
            onPress={() => {} /* Add calculation logic */}
            onPressIn={() => handlePressIn(calculateScale)}
            onPressOut={() => handlePressOut(calculateScale)}
          >
            <Text style={styles.calculateButtonText}>Calculate</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: hp('5%'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: wp('2%'),
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontWeight: '600',
    color: '#1F1F1F',
  },
  placeholderRight: {
    width: wp('10%'),
  },
  illustration: {
    alignItems: 'center',
    marginVertical: hp('2%'),
  },
  illustrationImage: {
    width: wp('60%'),
    height: wp('30%'),
    resizeMode: 'contain',
  },
  contentSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
  },
  infoText: {
    fontSize: wp('4%'),
    color: '#4B5563',
    marginBottom: hp('1%'),
  },
  cropSelectorWrapper: {
    borderRadius: wp('3%'),
  },
  cropSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp('3%'),
    padding: wp('3%'),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cropSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cropIcon: {
    width: wp('8%'),
    height: wp('8%'),
    marginRight: wp('2%'),
  },
  cropName: {
    fontSize: wp('4.5%'),
    fontWeight: '500',
    color: '#1F1F1F',
  },
  nutrientSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  numberBadge: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: '#6A994E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('3%'),
  },
  numberBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: wp('4%'),
  },
  sectionTitle: {
    fontSize: wp('5.5%'),
    fontWeight: '600',
    color: '#1F1F1F',
    flex: 1,
  },
  infoButton: {
    padding: wp('1%'),
  },
  nutrientDescription: {
    fontSize: wp('3.8%'),
    color: '#4B5563',
    marginBottom: hp('2%'),
    lineHeight: wp('5.5%'),
  },
  nutrientCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutrientCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    width: wp('28%'),
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  nutrientLabel: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#6A994E',
    marginBottom: hp('0.5%'),
  },
  nutrientValue: {
    fontSize: wp('5%'),
    fontWeight: '500',
    color: '#1F1F1F',
    marginBottom: hp('0.5%'),
  },
  nutrientPerTree: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
  },
  treeCountSection: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
  },
  treeCountLabel: {
    fontSize: wp('4.5%'),
    fontWeight: '500',
    color: '#1F1F1F',
    marginBottom: hp('1%'),
  },
  treeCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterButtonWrapper: {
    width: wp('15%'),
  },
  counterButton: {
    borderRadius: wp('2%'),
    justifyContent: 'center',
    alignItems: 'center',
    height: wp('12%'),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  counterButtonText: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  treeCountInputContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  treeCountInput: {
    backgroundColor: '#F9FAFB',
    width: wp('25%'),
    height: wp('12%'),
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: wp('4.5%'),
    fontWeight: '500',
    color: '#1F1F1F',
    textAlign: 'center',
    marginRight: wp('2%'),
  },
  treeCountInputLabel: {
    fontSize: wp('4%'),
    color: '#4B5563',
  },
  calculateButtonWrapper: {
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
  },
  calculateButton: {
    backgroundColor: '#6A994E',
    borderRadius: wp('3%'),
    paddingVertical: hp('2%'),
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  calculateButtonText: {
    fontSize: wp('4.5%'),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default FertilizerCalculatorScreen;