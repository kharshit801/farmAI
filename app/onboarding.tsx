import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import LottieView from 'lottie-react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import PrimaryButton from '../components/PrimaryButton';

const Onboarding = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const router = useRouter();

  const languages = [
    { id: 'english', name: 'English', subtext: 'Farming in your language' },
    { id: 'malayalam', name: 'മലയാളം', subtext: 'നിങ്ങളുടെ ഭാഷയിൽ കൃഷി' },
    { id: 'bengali', name: 'বাংলা', subtext: 'চাষাবাদের কথা আপনার ভাষায়' },
    { id: 'punjabi', name: 'ਪੰਜਾਬੀ', subtext: 'ਤੁਹਾਡੀ ਭਾਸ਼ਾ ਵਿੱਚ ਖੇਤੀਬਾੜੀ' },
    { id: 'gujarati', name: 'ગુજરાતી', subtext: 'ખેતી તમારી ભાષામાં' },
    { id: 'telugu', name: 'తెలుగు', subtext: 'మీ భాషలో వ్యవసాయం' },
    { id: 'kannada', name: 'ಕನ್ನಡ', subtext: 'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಕೃಷಿ' },
  ];

  const handleAccept = async () => {
    if (selectedLanguage) {
      try {
        await AsyncStorage.setItem('language', selectedLanguage);
        router.replace('/(tabs)' as const); // ✅ Type-safe route fix
      } catch (error) {
        console.error('Error saving language:', error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Image
              source={require('../assets/images/logoPlanta.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>
        {/* <LottieView
          source={require('../assets/lottie/camera.json')}
          autoPlay
          loop
          style={styles.lottie}
        /> */}
        <Text style={styles.title}>Namaste!</Text>
        <Text style={styles.subtitle}>Select your Planta language</Text>
      </View>

      <ScrollView style={styles.languageList}>
        {languages.map((language) => (
          <TouchableOpacity
            key={language.id}
            style={styles.languageItem}
            onPress={() => setSelectedLanguage(language.id)}
          >
            <View style={styles.languageTextContainer}>
              <Text style={styles.languageName}>{language.name}</Text>
              <Text style={styles.languageSubtext}>{language.subtext}</Text>
            </View>
            <View
              style={[
                styles.radioButton,
                selectedLanguage === language.id && styles.radioButtonSelected,
              ]}
            >
              {selectedLanguage === language.id && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Accept"
          onPress={handleAccept}
          style={selectedLanguage ? styles.acceptButton : styles.acceptButtonDisabled}
          disabled={!selectedLanguage}
        />
        <Text style={styles.termsText}>
          From ♥ <Text style={styles.linkText}>Team</Text>{' '}
          <Text style={styles.linkText}>Auxin</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { alignItems: 'center', paddingVertical: hp('3%') },
  logoContainer: { alignItems: 'center', marginBottom: hp('2%') },
  logo: {
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('7.5%'),
    backgroundColor: '#1f1f1f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: { width: wp('12%'), height: wp('12%') },
  lottie: { width: wp('30%'), height: wp('30%'), marginBottom: hp('2%') },
  title: {
    fontSize: wp('7%'),
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: hp('1%'),
  },
  subtitle: { fontSize: wp('4.5%'), color: '#6B7280' },
  languageList: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    marginTop: hp('2%'),
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp('4%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp('3%'),
    marginBottom: hp('2%'),
    backgroundColor: '#FFFFFF',
  },
  languageTextContainer: { flex: 1 },
  languageName: {
    fontSize: wp('5.5%'),
    fontWeight: '500',
    color: '#111827',
    marginBottom: hp('0.5%'),
  },
  languageSubtext: { fontSize: wp('3.5%'), color: '#6B7280' },
  radioButton: {
    height: wp('6%'),
    width: wp('6%'),
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: { borderColor: '#6A994E' },
  radioButtonInner: {
    height: wp('3.5%'),
    width: wp('3.5%'),
    borderRadius: wp('1.75%'),
    backgroundColor: '#3da094',
  },
  footer: { padding: wp('5%'), alignItems: 'center' },
  acceptButton: { marginBottom: hp('2%') },
  acceptButtonDisabled: { backgroundColor: '#9CA3AF' },
  termsText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: wp('3.5%'),
  },
  linkText: { color: '#087F8C' },
});

export default Onboarding;
