import React from 'react';
import { ScrollView, View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const CropCategories: React.FC = () => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.cropCategories}
    >
      <View style={styles.cropCategoryItem}>
        <Image
          source={require('../assets/images/potato.png')}
          style={styles.cropIcon}
        />
      </View>
      <View style={[styles.cropCategoryItem, styles.selectedCategory]}>
        <Image
          source={require('../assets/images/tomato.png')}
          style={styles.cropIcon}
        />
      </View>
      <View style={styles.cropCategoryItem}>
        <Image
          source={require('../assets/images/sugar-cane.png')}
          style={styles.cropIcon}
        />
      </View>
      <TouchableOpacity style={styles.addButton} activeOpacity={0.7}>
        <Ionicons name="add" size={wp('8%')} color="white" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  cropCategories: {
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    marginBottom: hp('1%'),
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cropCategoryItem: {
    width: wp('17%'),
    height: wp('17%'),
    borderRadius: wp('8.5%'),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: wp('2%'),
    borderWidth: 2,
    borderColor: '#FFD700',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  selectedCategory: {
    borderColor: '#BF4F45',
  },
  cropIcon: {
    width: wp('10%'),
    height: wp('10%'),
    resizeMode: 'contain',
  },
  addButton: {
    width: wp('17%'),
    height: wp('17%'),
    borderRadius: wp('8.5%'),
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: wp('2%'),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
});

export default CropCategories;