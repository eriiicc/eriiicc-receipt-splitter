import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleContinue = () => {
    if (phone.length < 10) { Alert.alert('Please enter a valid phone number'); return; }
    setLoading(true);
    router.push('/verify');
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Text style={styles.title}>Settled</Text>
      <Text style={styles.subtitle}>Split bills. Get settled.</Text>
      <TextInput style={styles.input} placeholder="(555) 555-5555" keyboardType="phone-pad" value={phone} onChangeText={setPhone} maxLength={10} placeholderTextColor="#6B7B6E" />
      <TouchableOpacity style={loading ? styles.buttonDisabled : styles.button} onPress={handleContinue} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Continue'}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF4', alignItems: 'center', justifyContent: 'center', padding: 24, paddingBottom: 80 },
  title: { fontSize: 36, fontWeight: '600', marginBottom: 8, color: '#1A4A3A' },
  subtitle: { fontSize: 15, color: '#6B7B6E', marginBottom: 40, textAlign: 'center' },
  input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#EEE8D0', borderRadius: 10, paddingHorizontal: 16, fontSize: 16, marginBottom: 16, backgroundColor: '#fff', color: '#1A1A1A' },
  button: { width: '100%', height: 50, backgroundColor: '#1A4A3A', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { width: '100%', height: 50, backgroundColor: '#26705A', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#F0D080', fontSize: 16, fontWeight: '500' },
});