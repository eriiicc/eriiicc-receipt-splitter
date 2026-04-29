import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../components/BackButton';

export default function PaymentScreen() {
  const { total } = useLocalSearchParams();
  const amount = parseFloat(total as string).toFixed(2);
  const router = useRouter();
  const [venmo, setVenmo] = useState('');
  const [cashapp, setCashapp] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('paymentInfo').then(val => {
      if (val) {
        const info = JSON.parse(val);
        if (info.venmo) setVenmo(info.venmo);
        if (info.cashapp) setCashapp(info.cashapp);
      }
    });
  }, []);

  const openVenmo = () => {
    const venmoUrl = `venmo://paycharge?txn=pay&recipients=${venmo}&amount=${amount}&note=Receipt+split`;
    Linking.canOpenURL(venmoUrl).then(supported => {
      if (supported) { Linking.openURL(venmoUrl); }
      else { Linking.openURL(`https://venmo.com/${venmo}?txn=pay&amount=${amount}&note=Receipt+split`); }
    });
  };

  const openCashApp = () => {
    const cashUrl = `cashapp://cash.app/pay/${cashapp}`;
    Linking.canOpenURL(cashUrl).then(supported => {
      if (supported) {
        Alert.alert('Opening Cash App', `Send $${amount} to ${cashapp}`, [
          { text: 'Open Cash App', onPress: () => Linking.openURL(cashUrl) },
          { text: 'Cancel' }
        ]);
      } else { Linking.openURL(`https://cash.app/${cashapp}`); }
    });
  };

  const openZelle = () => {
    Linking.openURL('https://enroll.zellepay.com').catch(() => {
      Alert.alert('Zelle', 'Please open your banking app and send payment via Zelle');
    });
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Pay your share</Text>
      <Text style={styles.subtitle}>Choose how you want to pay</Text>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Your total</Text>
        <Text style={styles.totalAmount}>${amount}</Text>
      </View>
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={[styles.button, styles.venmo]} onPress={openVenmo}>
          <Text style={styles.buttonText}>Pay with Venmo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.cashapp]} onPress={openCashApp}>
          <Text style={styles.buttonText}>Pay with Cash App</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.zelle]} onPress={openZelle}>
          <Text style={styles.buttonText}>Pay with Zelle</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.doneButton} onPress={() => router.replace('/home')}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE0', padding: 24, paddingTop: 100 },
  title: { fontSize: 28, fontWeight: '600', color: '#1A4A3A', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6B7B6E', marginBottom: 32, textAlign: 'center' },
  totalCard: { backgroundColor: '#EEE8D0', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 32, width: '100%' },
  totalLabel: { fontSize: 15, color: '#26705A', marginBottom: 8 },
  totalAmount: { fontSize: 48, fontWeight: '600', color: '#1A4A3A' },
  buttonGroup: { gap: 12, marginBottom: 24, width: '100%' },
  button: { padding: 16, borderRadius: 10, alignItems: 'center' },
  venmo: { backgroundColor: '#008CFF' },
  cashapp: { backgroundColor: '#00D632' },
  zelle: { backgroundColor: '#6D1ED4' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  doneButton: { borderWidth: 1, borderColor: '#EEE8D0', padding: 16, borderRadius: 10, alignItems: 'center' },
  doneButtonText: { fontSize: 16, color: '#6B7B6E' },
});