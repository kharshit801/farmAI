import React from 'react';
import { 
  Image, 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
     
    
      
    </SafeAreaView>
  );
}

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
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  cropCategories: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  cropCategoryItem: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  selectedCategory: {
    borderColor: '#BF4F45',
  },
  cropIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  addButton: {
    margin:10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  weatherCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  weatherDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  temperatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  temperatureText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 8,
  },
  sectionContainer: {
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  healStepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  healStep: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  healStepIcon: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  healStepText: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
    maxWidth: 80,
  },
  primaryButton: {
    backgroundColor: '#3563EB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  precisionFarmingCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  fieldImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  precisionFarmingContent: {
    flex: 1,
  },
  precisionFarmingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  precisionFarmingDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  chatBubble: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: '#6B7280',
  },
  activeNavText: {
    fontSize: 12,
    marginTop: 4,
    color: '#065F46',
    fontWeight: '500',
  },
});
