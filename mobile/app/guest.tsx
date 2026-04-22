import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

export default function GuestScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);

  const continueAsGuest = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://192.168.0.170:3000/api/session/${sessionId}`);
      const data = await response.json();
      if (data.error) {
        router.push({ pathname: '/select-items', params: { items: JSON.stringify([]), tax: '0', tip: '0', restaurantName: '' } });
        return;
      }
     router.push({
        pathname: '/select-items',
        params: {
          items: JSON.stringify(data.items),
          tax: data.tax.toString(),
          tip: data.tip.toString(),
          restaurantName: data.restaurantName || '',
          sessionId: sessionId as string,
          isGuest: 'true',
        },
      });
    } catch (error) {
      router.push({ pathname: '/select-items', params: { items: JSON.stringify([]), tax: '0', tip: '0', restaurantName: '' } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>🧾</Text>
        <Text style={styles.title}>You've been invited to split a bill</Text>
        <Text style={styles.subtitle}>No account needed — just select what you ordered and pay your share.</Text>

        <TouchableOpacity style={styles.button} onPress={continueAsGuest} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#F0D080" />
          ) : (
            <Text style={styles.buttonText}>Continue as Guest</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.signInButton} onPress={() => router.push('/')}>
          <Text style={styles.signInText}>Sign in instead</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE0', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 32, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#EEE8D0' },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '600', color: '#1A4A3A', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#6B7B6E', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  button: { backgroundColor: '#1A4A3A', padding: 16, borderRadius: 10, alignItems: 'center', width: '100%', marginBottom: 12 },
  buttonText: { color: '#F0D080', fontSize: 16, fontWeight: '500' },
  signInButton: { padding: 12 },
  signInText: { color: '#6B7B6E', fontSize: 14 },
});