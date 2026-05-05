import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import BackButton from '../components/BackButton';

export default function VerifyScreen() {
  const { confirmationId } = useLocalSearchParams();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();


const handleVerify = () => {
    if (code.length < 6) { Alert.alert('Please enter the 6 digit code'); return; }
    if (code !== '123456') { Alert.alert('Incorrect code', 'Please try again'); return; }
    setLoading(true);
    router.replace('/home');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <BackButton />
      <Text style={styles.title}>Check your texts</Text>
      <Text style={styles.subtitle}>Enter the 6 digit code we sent you</Text>
      <Text style={styles.hint}>use 123456 for testing</Text>
      <TextInput style={styles.input} placeholder="123456" keyboardType="number-pad" value={code} onChangeText={setCode} maxLength={6} placeholderTextColor="#6B7B6E" />
      <TouchableOpacity style={loading ? styles.buttonDisabled : styles.button} onPress={handleVerify} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify'}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF4', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '600', marginBottom: 8, color: '#1A4A3A' },
  subtitle: { fontSize: 15, color: '#6B7B6E', marginBottom: 8, textAlign: 'center' },
  hint: { fontSize: 13, color: '#6B7B6E', marginBottom: 24, textAlign: 'center' },
  input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#EEE8D0', borderRadius: 10, paddingHorizontal: 16, fontSize: 24, marginBottom: 16, textAlign: 'center', letterSpacing: 8, backgroundColor: '#fff' },
  button: { width: '100%', height: 50, backgroundColor: '#1A4A3A', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { width: '100%', height: 50, backgroundColor: '#26705A', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#F0D080', fontSize: 16, fontWeight: '500' },
});