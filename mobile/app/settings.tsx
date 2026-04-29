import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../components/BackButton';

export default function SettingsScreen() {
  const [venmo, setVenmo] = useState('');
  const [cashapp, setCashapp] = useState('');
  const [zelle, setZelle] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem('paymentInfo').then(val => {
      if (val) {
        const info = JSON.parse(val);
        setVenmo(info.venmo || '');
        setCashapp(info.cashapp || '');
        setZelle(info.zelle || '');
      }
    });
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      await AsyncStorage.setItem('paymentInfo', JSON.stringify({ venmo, cashapp, zelle }));
      Alert.alert('Saved!', 'Your payment info has been updated.');
    } catch (error) {
      Alert.alert('Error', 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <BackButton />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Payment Settings</Text>
        <Text style={styles.subtitle}>Enter your payment details so guests can pay you back</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Venmo username</Text>
          <Text style={styles.hint}>Found in your Venmo profile (without the @)</Text>
          <TextInput
            style={styles.input}
            placeholder="your-venmo-username"
            placeholderTextColor="#6B7B6E"
            value={venmo}
            onChangeText={setVenmo}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Cash App cashtag</Text>
          <Text style={styles.hint}>Include the $ sign (e.g. $yourcashtag)</Text>
          <TextInput
            style={styles.input}
            placeholder="$yourcashtag"
            placeholderTextColor="#6B7B6E"
            value={cashapp}
            onChangeText={setCashapp}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Zelle email or phone</Text>
          <Text style={styles.hint}>The email or phone number linked to your Zelle account</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com or 5551234567"
            placeholderTextColor="#6B7B6E"
            value={zelle}
            onChangeText={setZelle}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={save} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save settings'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE0' },
  scroll: { padding: 24, paddingTop: 120, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '600', color: '#1A4A3A', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B7B6E', marginBottom: 32, lineHeight: 22 },
  field: { marginBottom: 24 },
  label: { fontSize: 15, fontWeight: '500', color: '#1A4A3A', marginBottom: 4 },
  hint: { fontSize: 13, color: '#6B7B6E', marginBottom: 8 },
  input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#EEE8D0', borderRadius: 10, paddingHorizontal: 16, fontSize: 16, backgroundColor: '#fff', color: '#1A1A1A' },
  button: { backgroundColor: '#1A4A3A', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { backgroundColor: '#6B7B6E' },
  buttonText: { color: '#F0D080', fontSize: 16, fontWeight: '500' },
});