// components/ManageFields.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, Pressable ,TouchableOpacity} from 'react-native'; // Import Pressable
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import LottieView from 'lottie-react-native';
import { router, useRouter } from 'expo-router'; // Import useRouter
import fields from './../app/fields'

const ManageFields: React.FC = () => {

 
 const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push('/fields')}>
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
        {/* Wrap the chat bubble content with Pressable */}
       
      </View>
    </View>
    </TouchableOpacity>
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
 
  // healStepIcon and its styles are not used for the chat bubble,
  // but keeping them here based on your original code.
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