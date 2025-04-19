// components/cards/FieldProfitCard.tsx
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Card from '../ui/Card';

interface FieldProfitCardProps {
  amount: string;
  currency: string;
  onPress?: () => void;
}

const FieldProfitCard = ({ amount, currency, onPress }: FieldProfitCardProps) => {
  return (
    <Card onPress={onPress} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <FontAwesome5 name="chart-line" size={24} color="#003366" />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.amountContainer}>
            <Text style={styles.currency}>{currency}</Text>
            <Text style={styles.amount}>{amount}</Text>
          </View>
          <Text style={styles.title}>Estimate your field profit</Text>
          <Text style={styles.subtitle}>by keeping track of your expenses</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#003366" style={styles.arrow} />
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currency: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#001A33',
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#001A33',
    marginLeft: 4,
  },
  title: {
    color: '#001A33',
    fontWeight: '600',
    fontSize: 16,
  },
  subtitle: {
    color: '#4D6177',
    fontSize: 14,
  },
  arrow: {
    position: 'absolute',
    right: 12,
  },
});

export default FieldProfitCard;