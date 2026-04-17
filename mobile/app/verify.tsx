import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function VerifyScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = () => {
    if (code.length < 6) {
      Alert.alert('Please enter the 6 digit code');
      return;
    }
    if (code !== '123456') {
      Alert.alert('Incorrect code', 'Please try again');
      return;
    }
    setLoading(true);
    router.replace('/home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check your texts</Text>
      <Text style={styles.subtitle}>Enter the 6 digit code we sent you</Text>
      <Text style={styles.hint}>use 123456 for testing</Text>
      <TextInput
        style={styles.input}
        placeholder="123456"
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
        maxLength={6}
      />
      <TouchableOpacity
        style={loading ? styles.buttonDisabled : styles.button}
        onPress={handleVerify}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Verifying...' : 'Verify'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    marginBottom: 8,
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    color: '#bbb',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 8,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#534AB7',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    width: '100%',
    height: 50,
    backgroundColor: '#9992D4',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});