import React, { useContext, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { LocationContext } from '@/app/_layout';

export default function SomeScreen() {
  const { location, errorMsg, requestLocationPermission } = useContext(LocationContext);

  useEffect(() => {
    // You can use the location data when the component mounts
    if (location) {
      console.log('Current location:', location);
      // Do something with the location data
    }
  }, [location]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location Example</Text>
      
      {location ? (
        <View style={styles.locationContainer}>
          <Text style={styles.locationText}>Your current location:</Text>
          <Text>Latitude: {location.latitude}</Text>
          <Text>Longitude: {location.longitude}</Text>
        </View>
      ) : (
        <Text>{errorMsg || 'Getting location...'}</Text>
      )}
      
      <Button 
        title="Refresh Location" 
        onPress={requestLocationPermission} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  locationContainer: {
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    width: '100%',
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  }
});