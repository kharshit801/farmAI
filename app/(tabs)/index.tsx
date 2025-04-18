import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Screen } from 'react-native-screens';
import Header from '../../components/Header';
import CropCategories from '../../components/CropCategories';
import WeatherCard from '../../components/WeatherCard';
import HealYourCrop from '../../components/HealYourCrop';
import ManageFields from '../../components/ManageFields';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
    <Screen style={styles.container}>
      <Header />
      <CropCategories />
      <WeatherCard />
      <HealYourCrop />
      <ManageFields />
    </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});