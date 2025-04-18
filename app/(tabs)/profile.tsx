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

import images from '@assets/images'; 
import { Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';


export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plantix</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuDots}>•••</Text>
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Account Section */}
        <View style={styles.accountSection}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={images.profilePlaceholder} 
              style={styles.profileImage} 
            />
          </View>
          
          <View style={styles.accountInfo}>
            <Text style={styles.accountTitle}>Your account</Text>
            <Text style={styles.communityText}>Join Plantix Community</Text>
            
            <TouchableOpacity style={styles.signInButton}>
              <Text style={styles.signInText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Survey Banner */}
        <View style={styles.surveyBanner}>
          <View style={styles.surveyContent}>
            <Image 
              source={images.logo} 
              style={styles.farmerImage} 
            />
            <View style={styles.surveyTextContainer}>
              <Text style={styles.surveyTitle}>Help us make a better app for your farming needs.</Text>
              <TouchableOpacity style={styles.surveyButton}>
                <Text style={styles.surveyButtonText}>Take a survey</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        {/* Grow Smart Section */}
        <View style={styles.growSmartSection}>
          <Image 
            source={images.leaf} 
            style={styles.leafLogo} 
          />
          <View style={styles.growSmartTextContainer}>
            <Text style={styles.growSmartTitle}>Grow smart together!</Text>
            <Text style={styles.growSmartDescription}>
              Share Plantix and help farmers solve their plant problems.
            </Text>
          </View>
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareButtonText}>Share Plantix</Text>
          </TouchableOpacity>
        </View>
        
        {/* Feedback Section */}
        <View style={styles.feedbackSection}>
          <View style={styles.feedbackIconContainer}>
          <MaterialIcons name="feedback" size={24} color="black" />
            
          </View>
          <View style={styles.feedbackTextContainer}>
            <Text style={styles.feedbackTitle}>How is your experience with Plantix app?</Text>
            <Text style={styles.feedbackDescription}>
              We'd love to hear your thoughts and suggestions.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  menuButton: {
    padding: 5,
  },
  menuDots: {
    fontSize: 24,
    color: '#333',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  accountSection: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#e0f2f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  profileImage: {
    width: 70,
    height: 70,
  },
  accountInfo: {
    flex: 1,
  },
  accountTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  communityText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 15,
  },
  signInButton: {
    borderWidth: 1,
    borderColor: '#2e8b76',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signInText: {
    color: '#2e8b76',
    fontSize: 16,
    fontWeight: '600',
  },
  surveyBanner: {
    backgroundColor: '#b2dfdb',
    padding: 15,
    marginTop: 15,
    borderRadius: 5,
    marginHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  surveyContent: {
    flexDirection: 'row',
    flex: 1,
  },
  farmerImage: {
    width: 80,
    height: 100,
  },
  surveyTextContainer: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: 'center',
  },
  surveyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  surveyButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
  },
  surveyButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#333',
  },
  growSmartSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 15,
    borderRadius: 5,
    marginHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leafLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  growSmartTextContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  growSmartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  growSmartDescription: {
    fontSize: 14,
    color: '#555',
  },
  shareButton: {
    marginLeft: 10,
  },
  shareButtonText: {
    color: '#2e8b76',
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 15,
    borderRadius: 5,
    marginHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  feedbackIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0f2f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackIcon: {
    width: 30,
    height: 30,
  },
  feedbackTextContainer: {
    flex: 1,
    paddingLeft: 15,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  feedbackDescription: {
    fontSize: 14,
    color: '#555',
  }
});