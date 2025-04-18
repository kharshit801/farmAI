import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import LottieView from 'lottie-react-native';

const ManageFields: React.FC = () => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Manage your fields</Text>
      <View style={styles.precisionFarmingCard}>
        <Image 
          source={require("../assets/images/tea.png")} 
          style={styles.fieldImage} 
        />
        <View style={styles.precisionFarmingContent}>
          <Text style={styles.precisionFarmingTitle}>Start precision farming</Text>
          <Text style={styles.precisionFarmingDesc}>
            Add your field to unlock tailored insights and treatment plans
          </Text>
        </View>
        <View style={styles.chatBubble}>
          {/* <MaterialCommunityIcons name="message-outline" size={wp('6%')} color="#1D4ED8" /> */}
          {/* <View style={styles.healStepIcon}> */}
            <LottieView
              source={require('../assets/lottie/chat.json')} // Replace with your document Lottie file
              autoPlay
              loop
              style={styles.lottieIcon}
            />
          {/* </View> */}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: wp('4%'),
    marginVertical: hp('2%'),
  },
  sectionTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '600',
    color: '#111827',
    marginBottom: hp('2%'),
  },
  precisionFarmingCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    alignItems: 'center',
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  fieldImage: {
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('2%'),
    marginRight: wp('4%'),
  },
  precisionFarmingContent: {
    flex: 1,
  },
  precisionFarmingTitle: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#111827',
    marginBottom: hp('0.5%'),
  },
  precisionFarmingDesc: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
    lineHeight: hp('2.5%'),
  },
  chatBubble: {
    position: 'absolute',
    top: wp('4%'),
    right: wp('4%'),
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('5%'),
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieIcon: {
    width: wp('16%'),
    height: wp('16%'),
  },
  healStepIcon: {
    width: wp('12%'),
    height: wp('12%'),
    borderWidth: 1,
    borderColor: '#9CA3AF',
    borderRadius: wp('1%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },

});

export default ManageFields;