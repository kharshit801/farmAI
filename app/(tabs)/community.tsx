import { Image, StyleSheet, Platform, Text,View, SafeAreaView } from 'react-native';



export default function CommunityScreen() {
  return (
    <SafeAreaView style={styles.stepContainer}>
    <Text style={styles.reactLogo}>Community</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    flex:1,
    height:"auto",
    backgroundColor:"1f1f1f"
  },
  reactLogo: {
    alignContent:"center",
    justifyContent:"center",
  },
});
