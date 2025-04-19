import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

type PrimaryButtonProps = {
  title: string;
  onPress?: () => void;
  style?: any;
  disabled?: boolean;
};

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ title, onPress, style, disabled }) => {
  return (
    <TouchableOpacity 
      style={[styles.primaryButton, style, disabled && styles.disabledButton]} 
      onPress={onPress} 
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Text style={[styles.primaryButtonText, disabled && styles.disabledText]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: '#3563EB',
    borderRadius: wp('2%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: wp('4%'),
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  disabledText: {
    color: '#FFFFFF',
  },
});

export default PrimaryButton;

// import React from 'react';
// import { TouchableOpacity, Text, StyleSheet } from 'react-native';
// import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
// import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// type PrimaryButtonProps = {
//   title: string;
//   onPress?: () => void;
// };

// const PrimaryButton: React.FC<PrimaryButtonProps> = ({ title, onPress }) => {
//   const scale = useSharedValue(1);

//   const animatedStyle = useAnimatedStyle(() => ({
//     transform: [{ scale: scale.value }],
//   }));

//   const handlePressIn = () => {
//     scale.value = withSpring(0.95);
//   };

//   const handlePressOut = () => {
//     scale.value = withSpring(1);
//     onPress?.();
//   };

//   return (
//     <TouchableOpacity
//       onPressIn={handlePressIn}
//       onPressOut={handlePressOut}
//       activeOpacity={1}
//     >
//       <Animated.View style={[styles.primaryButton, animatedStyle]}>
//         <Text style={styles.primaryButtonText}>{title}</Text>
//       </Animated.View>
//     </TouchableOpacity>
//   );
// };

// const styles = StyleSheet.create({
//   primaryButton: {
//     backgroundColor: '#3563EB',
//     borderRadius: wp('2%'),
//     paddingVertical: hp('2%'),
//     paddingHorizontal: wp('4%'),
//     alignItems: 'center',
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.15,
//     shadowRadius: 4,
//   },
//   primaryButtonText: {
//     color: '#FFFFFF',
//     fontSize: wp('4%'),
//     fontWeight: '600',
//   },
// });

// export default PrimaryButton;