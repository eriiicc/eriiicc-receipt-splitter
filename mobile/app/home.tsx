import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();
  const [paymentSetup, setPaymentSetup] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('paymentInfo').then(val => {
      if (!val) {
        setPaymentSetup(false);
      } else {
        const info = JSON.parse(val);
        setPaymentSetup(!!(info.venmo || info.cashapp || info.zelle));
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settled</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {!paymentSetup && (
        <TouchableOpacity style={styles.setupBanner} onPress={() => router.push('/settings')}>
          <Text style={styles.setupBannerEmoji}>👆</Text>
          <View style={styles.setupBannerText}>
            <Text style={styles.setupBannerTitle}>Set up how you get paid</Text>
            <Text style={styles.setupBannerSubtitle}>Add your Venmo, Cash App, or Zelle before splitting</Text>
          </View>
          <Text style={styles.setupBannerArrow}>›</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.subtitle}>No splits yet — start one below</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/new-split')}>
        <Text style={styles.buttonText}>+ New Split</Text>
        <TouchableOpacity style={styles.historyButton} onPress={() => router.push('/history')}>
        <Text style={styles.historyButtonText}>View Split History</Text>
      </TouchableOpacity>
      </TouchableOpacity>
      <TouchableOpacity style={styles.testButton} onPress={() => router.push({ pathname: '/guest', params: { sessionId: '123' } })}>
        <Text style={styles.testButtonText}>Test Guest View</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE0', padding: 24, paddingTop: 64 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '600', color: '#1A4A3A' },
  settingsButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEE8D0', alignItems: 'center', justifyContent: 'center' },
  settingsIcon: { fontSize: 20 },
  setupBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A4A3A', borderRadius: 12, padding: 16, marginBottom: 24, gap: 12 },
  setupBannerEmoji: { fontSize: 24 },
  setupBannerText: { flex: 1 },
  setupBannerTitle: { fontSize: 15, fontWeight: '600', color: '#F0D080', marginBottom: 2 },
  setupBannerSubtitle: { fontSize: 13, color: '#EEE8D0' },
  setupBannerArrow: { fontSize: 22, color: '#F0D080', fontWeight: '300' },
  subtitle: { fontSize: 15, color: '#6B7B6E', marginBottom: 40 },
  button: { backgroundColor: '#1A4A3A', padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#F0D080', fontSize: 16, fontWeight: '500' },
  testButton: { marginTop: 12, padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#1A4A3A', alignItems: 'center' },
  testButtonText: { color: '#1A4A3A', fontSize: 16 },
});