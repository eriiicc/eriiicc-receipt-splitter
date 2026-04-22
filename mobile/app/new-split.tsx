import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import BackButton from '../components/BackButton';

export default function NewSplitScreen() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');
  const router = useRouter();

  const convertToJpeg = async (uri) => {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    return result.base64;
  };

  const navigateToItems = (data) => {
    const items = data.items && data.items.length > 0
      ? data.items
      : [{ name: 'Could not read receipt', price: 0.00, quantity: 1 }];
    const tax = data.tax || 0;
    const tip = data.tip || 0;
    const restaurantName = data.restaurantName || '';
    console.log('Navigating with tax:', tax, 'tip:', tip);
    console.log('Restaurant name from backend:', data.restaurantName);
    router.push({
      pathname: '/select-items',
      params: { items: JSON.stringify(items), tax: tax.toString(), tip: tip.toString(), restaurantName },
    });
  };

  const scanReceipt = async (uri) => {
    try {
      setLoading(true);
      const base64 = await convertToJpeg(uri);
      const response = await fetch('http://192.168.0.170:3000/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await response.json();
      navigateToItems(data);
    } catch (error) {
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const scanReceiptUrl = async () => {
    if (!receiptUrl.startsWith('http')) {
      Alert.alert('Please enter a valid URL');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch('http://192.168.0.170:3000/api/scan-receipt-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: receiptUrl }),
      });
      const data = await response.json();
      navigateToItems(data);
    } catch (error) {
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { Alert.alert('Permission needed', 'Please allow camera access'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, mediaTypes: 'images' });
    if (!result.canceled) { setImage(result.assets[0].uri); scanReceipt(result.assets[0].uri); }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, mediaTypes: 'images' });
    if (!result.canceled) { setImage(result.assets[0].uri); scanReceipt(result.assets[0].uri); }
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={styles.title}>New Split</Text>
        <Text style={styles.subtitle}>Upload a receipt to get started</Text>
        {image && <Image source={{ uri: image }} style={styles.preview} />}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1A4A3A" />
            <Text style={styles.loadingText}>Reading your receipt...</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Paste a receipt link</Text>
              <Text style={styles.sectionHint}>Works with Toast, Square, and other digital receipts</Text>
              <TextInput
                style={styles.input}
                placeholder="https://receipts.toasttab.com/..."
                placeholderTextColor="#6B7B6E"
                value={receiptUrl}
                onChangeText={setReceiptUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
              <TouchableOpacity
                style={[styles.button, !receiptUrl && styles.buttonDisabled]}
                onPress={scanReceiptUrl}
                disabled={!receiptUrl}
              >
                <Text style={styles.buttonText}>Scan Receipt Link</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Take or upload a photo</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity style={styles.button} onPress={takePhoto}>
                  <Text style={styles.buttonText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonOutline} onPress={pickPhoto}>
                  <Text style={styles.buttonOutlineText}>Choose from Library</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE0' },
  scroll: { padding: 24, paddingTop: 120, alignItems: 'center', paddingBottom: 400 },
  title: { fontSize: 28, fontWeight: '600', color: '#1A4A3A', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6B7B6E', marginBottom: 32, textAlign: 'center' },
  preview: { width: '100%', height: 200, borderRadius: 10, marginBottom: 24, resizeMode: 'cover' },
  loadingBox: { alignItems: 'center', marginTop: 40 },
  loadingText: { marginTop: 16, fontSize: 15, color: '#6B7B6E' },
  section: { width: '100%', marginBottom: 8 },
  sectionLabel: { fontSize: 15, fontWeight: '500', color: '#1A4A3A', marginBottom: 6 },
  sectionHint: { fontSize: 13, color: '#6B7B6E', marginBottom: 12 },
  buttonGroup: { gap: 10 },
  button: { backgroundColor: '#1A4A3A', padding: 16, borderRadius: 10, alignItems: 'center', width: '100%' },
  buttonDisabled: { backgroundColor: '#6B7B6E' },
  buttonOutline: { borderWidth: 1, borderColor: '#1A4A3A', padding: 16, borderRadius: 10, alignItems: 'center', width: '100%' },
  buttonText: { color: '#F0D080', fontSize: 16, fontWeight: '500' },
  buttonOutlineText: { color: '#1A4A3A', fontSize: 16, fontWeight: '500' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#EEE8D0' },
  dividerText: { marginHorizontal: 12, fontSize: 14, color: '#6B7B6E' },
  input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#EEE8D0', borderRadius: 10, paddingHorizontal: 16, fontSize: 14, marginBottom: 12, backgroundColor: '#fff', color: '#1A1A1A' },
});