import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import BackButton from '../components/BackButton';

export default function HomeScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Settled</Text>
      <Text style={styles.subtitle}>No splits yet — start one below</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/new-split')}>
        <Text style={styles.buttonText}>+ New Split</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.testButton} onPress={() => router.push({ pathname: '/guest', params: { sessionId: '123' } })}>
        <Text style={styles.testButtonText}>Test Guest View</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE0', alignItems: 'center', justifyContent: 'center', padding: 24 },
  testButton: { marginTop: 12, padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#1A4A3A', alignItems: 'center' },
  testButtonText: { color: '#1A4A3A', fontSize: 16 },
  title: { fontSize: 36, fontWeight: '600', color: '#1A4A3A', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6B7B6E', marginBottom: 40, textAlign: 'center' },
  button: { backgroundColor: '#1A4A3A', paddingVertical: 16, paddingHorizontal: 48, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#F0D080', fontSize: 16, fontWeight: '500' },
});