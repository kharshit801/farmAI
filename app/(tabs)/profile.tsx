import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import images from "@/assets/images";
import Header from "@/components/Header";
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import PrimaryButton from "@/components/PrimaryButton";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Header/>
      
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <View style={styles.accountSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={wp('8%')} color="#1f1f1f" />
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountTitle}>Your Account</Text>
            <Text style={styles.communityText}>Join the FarmAI Community</Text>
            <TouchableOpacity 
              style={styles.signInButton}
              activeOpacity={0.7}
            >
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Grow Smart Section */}
        <View style={styles.sectionCard}>
          <Image 
            source={images.logo} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View style={styles.sectionTextContainer}>
            <Text style={styles.sectionTitle}>Grow Smart Together</Text>
            <Text style={styles.sectionDescription}>
              Share FarmAI and help farmers solve plant problems.
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.shareButton}
            activeOpacity={0.7}
          >
            <Text style={styles.shareButtonText}>Share FarmAI</Text>
          </TouchableOpacity>
        </View>

        {/* Feedback Section */}
        <View style={styles.sectionCard}>
          <View style={styles.feedbackIconContainer}>
            <MaterialIcons name="feedback" size={wp('6%')} color="#6A994E" />
          </View>
          <View style={styles.sectionTextContainer}>
            <Text style={styles.sectionTitle}>Enjoying FarmAI?</Text>
            <Text style={styles.sectionDescription}>
              We'd love to hear your thoughts and suggestions.
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.feedbackButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-forward-ios" size={wp('4%')} color="#2e8b76" />
          </TouchableOpacity>
        </View>

        {/* Contact Us Button */}
        <TouchableOpacity 
          style={styles.contactButton}
          activeOpacity={0.7}
        >
          <Text style={styles.contactButtonText}>Contact Us</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  contentContainer: {
    paddingBottom: hp('10%'),
  },
  accountSection: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: wp('5%'),
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#e9ecef",
    marginBottom: hp('2%'),
  },
  avatarContainer: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('4%'),
  },
  accountInfo: {
    flex: 1,
  },
  accountTitle: {
    fontSize: wp('4.5%'),
    fontWeight: "700",
    color: "#212529",
    marginBottom: hp('0.5%'),
  },
  communityText: {
    fontSize: wp('3.5%'),
    color: "#6c757d",
    marginBottom: hp('1%'),
  },
  signInButton: {
    borderWidth: 1.5,
    borderColor: "#2e8b76",
    borderRadius: wp('6%'),
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('5%'),
    alignSelf: 'flex-start',
  },
  signInText: {
    color: "#6A994E",
    fontWeight: "600",
    fontSize: wp('3.5%'),
  },
  sectionCard: {
    backgroundColor: "#fff",
    padding: wp('5%'),
    marginHorizontal: wp('4%'),
    marginBottom: hp('2%'),
    borderRadius: wp('3%'),
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  logoImage: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('2%'),
  },
  sectionTextContainer: {
    flex: 1,
    marginHorizontal: wp('4%'),
  },
  sectionTitle: {
    fontSize: wp('4%'),
    fontWeight: "600",
    color: "#1f1f1f",
    marginBottom: hp('0.5%'),
  },
  sectionDescription: {
    fontSize: wp('3.5%'),
    color: "#495057",
    lineHeight: wp('5%'),
  },
  shareButton: {
    padding: wp('2%'),
  },
  shareButtonText: {
    color: "#6A994E",
    fontWeight: "600",
    fontSize: wp('3.5%'),
  },
  feedbackIconContainer: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
  },
  feedbackButton: {
    padding: wp('2%'),
  },
  contactButton: {
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
    backgroundColor: "#6A994E",
    paddingVertical: hp('2%'),
    borderRadius: wp('2%'),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  contactButtonText: {
    color: "#fff",
    fontSize: wp('4%'),
    fontWeight: "600",
  },
});
