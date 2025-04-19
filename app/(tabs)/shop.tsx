import React from 'react';
import { StyleSheet, SafeAreaView, StatusBar, View, Text } from 'react-native';
import ShopScreenComponent from '@/components/shops_near';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import Header from '@/components/Header';

export default function ShopScreen() {
  const colorScheme = useColorScheme();
  
  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { backgroundColor: Colors[colorScheme ?? 'light'].background }
      ]}
    >
      
     <Header/>
      <ShopScreenComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});