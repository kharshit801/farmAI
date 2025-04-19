import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import images from "@/assets/images";
import Header from "@/components/Header";
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';


export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header/>
      
      {/* Content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Account Section */}
        <View style={styles.accountSection}>
        <Ionicons name={"person"} size={32} color={"#1f1f1f"} />
        <View style={styles.accountInfo}>
            <Text style={styles.accountTitle}>Your Account</Text>
            <Text style={styles.communityText}>Join the FarmAI Community</Text>
            <TouchableOpacity style={styles.signInButton}>
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Survey Banner */}
        {/* <View style={styles.surveyBanner}>
          <Image source={images.tea} style={styles.bannerImage} />
          <View style={styles.surveyTextContainer}>
            <Text style={styles.surveyTitle}>
              Help us improve FarnAI for your farming needs.
            </Text>
            <TouchableOpacity style={styles.surveyButton}>
              <Text style={styles.surveyButtonText}>Take a Survey</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View> */}

        {/* Grow Smart Section */}
        <View style={styles.sectionCard}>
          <Image source={images.logo} style={styles.logoImage} />
          <View style={styles.sectionTextContainer}>
            <Text style={styles.sectionTitle}>Grow Smart Together</Text>
            <Text style={styles.sectionDescription}>
              Share FarmAI and help farmers solve plant problems.
            </Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.shareButtonText}>Share FarmAI</Text>
          </TouchableOpacity>
        </View>

        {/* Feedback Section */}
        <View style={styles.sectionCard}>
          <View style={styles.feedbackIconContainer}>
            <MaterialIcons name="feedback" size={28} color="#2e8b76" />
          </View>
          <View style={styles.sectionTextContainer}>
            <Text style={styles.sectionTitle}>Enjoying FarmAI?</Text>
            <Text style={styles.sectionDescription}>
              We'd love to hear your thoughts and suggestions.
            </Text>
          </View>
        </View>

        {/* Contact Us Button */}
        <TouchableOpacity style={styles.contactButton}>
          <Text style={styles.contactButtonText}>Contact Us</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  menuButton: {
    padding: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#ccc",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2e8b76",
  },
  menuDots: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  contentContainer: {
    paddingBottom: 100,
  },
  accountSection: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  profileImage: {
    width: 80,
    height: 90,
    borderRadius: 10,
    marginRight: 15,
  },
  accountInfo: {
    flex: 1,
  },
  accountTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  communityText: {
    fontSize: 14,
    color: "#666",
    marginVertical: 5,
  },
  signInButton: {
    borderWidth: 1,
    borderColor: "#2e8b76",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 5,
  },
  signInText: {
    color: "#2e8b76",
    fontWeight: "600",
  },
  surveyBanner: {
    flexDirection: "row",
    backgroundColor: "#d0f0ec",
    borderRadius: 10,
    padding: 15,
    margin: 15,
    alignItems: "center",
    position: "relative",
  },
  bannerImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  surveyTextContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  surveyTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  surveyButton: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  surveyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2e8b76",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  closeButtonText: {
    fontSize: 18,
    color: "#555",
  },
  sectionCard: {
    backgroundColor: "#fff",
    padding: 20,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  logoImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  sectionTextContainer: {
    flex: 1,
    marginHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2e8b76",
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#555",
  },
  shareButtonText: {
    color: "#2e8b76",
    fontWeight: "600",
  },
  feedbackIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#d0f0ec",
    justifyContent: "center",
    alignItems: "center",
  },
  contactButton: {
    margin: 20,
    backgroundColor: "#6A994E",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
  },
  contactButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
