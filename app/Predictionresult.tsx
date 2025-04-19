// import React, { useEffect } from 'react';
// import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
// import { useDiagnosis } from '../context/DiagnosisContext';

// const PredictionResult = () => {
//   const { diagnosisData } = useDiagnosis();
  
//   useEffect(() => {
//     console.log('PredictionResult component mounted');
//     console.log('Diagnosis data:', diagnosisData);
//   }, [diagnosisData]);

//   if (!diagnosisData || !diagnosisData.imageUri || !diagnosisData.result) {
//     return (
//       <View style={styles.centered}>
//         <Text style={styles.message}>No diagnosis data to display.</Text>
//         <Text style={styles.subMessage}>Please take a picture of your crop first.</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       <Text style={styles.title}>Diagnosis Result</Text>
//       <Image 
//         source={{ uri: diagnosisData.imageUri }} 
//         style={styles.image}
//         resizeMode="cover"
//       />
//       <View style={styles.resultContainer}>
//         <Text style={styles.resultLabel}>Result:</Text>
//         <Text style={styles.resultText}>{diagnosisData.result}</Text>
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     padding: 20,
//     alignItems: 'center',
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     marginBottom: 20,
//     color: '#111827',
//   },
//   image: {
//     width: 300,
//     height: 300,
//     borderRadius: 12,
//     marginBottom: 20,
//   },
//   resultContainer: {
//     width: '100%',
//     backgroundColor: '#f0fdf4',
//     padding: 16,
//     borderRadius: 8,
//     borderLeftWidth: 4,
//     borderLeftColor: '#16a34a',
//   },
//   resultLabel: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#166534',
//     marginBottom: 4,
//   },
//   resultText: {
//     fontSize: 18,
//     color: '#16a34a',
//     fontWeight: '500',
//   },
//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   message: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#4B5563',
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   subMessage: {
//     fontSize: 14,
//     color: '#6B7280',
//     textAlign: 'center',
//   },
// });

// export default PredictionResult;