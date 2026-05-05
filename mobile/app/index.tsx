import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

const redirectUri = AuthSession.makeRedirectUri({
    useProxy: true,
  });

 const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '351911635604-f8t6ufpcnim75cmv9du4jkh1h5o5p931.apps.googleusercontent.com',
    iosClientId: '351911635604-hin3a2jgn1hc0ltjqpurn34c4rstit4k.apps.googleusercontent.com',
    redirectUri: 'https://auth.expo.io/@ericgr/settled',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      router.replace('/home');
    }
  }, [response]);

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

      <TextInput
        style={styles.input}
        placeholder="(555) 555-5555"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        maxLength={10}
        placeholderTextColor="#6B7B6E"
      />
      <TouchableOpacity
        style={loading ? styles.buttonDisabled : styles.button}
        onPress={handleContinue}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Continue with phone'}</Text>
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={() => promptAsync()}
        disabled={!request}
      >
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE0', alignItems: 'center', justifyContent: 'center', padding: 24, paddingBottom: 80 },
  title: { fontSize: 36, fontWeight: '600', marginBottom: 8, color: '#1A4A3A' },
  subtitle: { fontSize: 15, color: '#6B7B6E', marginBottom: 40, textAlign: 'center' },
  input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#EEE8D0', borderRadius: 10, paddingHorizontal: 16, fontSize: 16, marginBottom: 16, backgroundColor: '#fff', color: '#1A1A1A' },
  button: { width: '100%', height: 50, backgroundColor: '#1A4A3A', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { width: '100%', height: 50, backgroundColor: '#26705A', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#F0D080', fontSize: 16, fontWeight: '500' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#EEE8D0' },
  dividerText: { marginHorizontal: 12, fontSize: 14, color: '#6B7B6E' },
  googleButton: { width: '100%', height: 50, backgroundColor: '#fff', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEE8D0' },
  googleButtonText: { color: '#1A1A1A', fontSize: 16, fontWeight: '500' },
});