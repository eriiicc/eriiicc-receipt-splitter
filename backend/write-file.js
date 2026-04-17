const fs = require('fs');
const path = require('path');
const backButtonImport = `import BackButton from '../components/BackButton';`;
const colors = {
  primary: '#1A4A3A',
  secondary: '#26705A',
  accent: '#F0D080',
  background: '#F2EDE0',
  card: '#EEE8D0',
  text: '#1A1A1A',
  muted: '#6B7B6E',
  white: '#fff',
};

const newSplitScreen = `import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

export default function NewSplitScreen() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const convertToJpeg = async (uri) => {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    return result.base64;
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
      const items = data.items && data.items.length > 0 ? data.items : [{ name: 'Could not read receipt', price: 0.00 }];
      router.push({ pathname: '/select-items', params: { items: JSON.stringify(items) } });
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
      <Text style={styles.title}>New Split</Text>
      <Text style={styles.subtitle}>Take a photo of your receipt</Text>
      {image && <Image source={{ uri: image }} style={styles.preview} />}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="${colors.primary}" />
          <Text style={styles.loadingText}>Reading your receipt...</Text>
        </View>
      ) : (
        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.button} onPress={takePhoto}>
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonOutline} onPress={pickPhoto}>
            <Text style={styles.buttonOutlineText}>Choose from Library</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '${colors.background}', padding: 24, paddingTop: 64 },
  title: { fontSize: 28, fontWeight: '600', color: '${colors.primary}', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '${colors.muted}', marginBottom: 32 },
  preview: { width: '100%', height: 200, borderRadius: 10, marginBottom: 24, resizeMode: 'cover' },
  loadingBox: { alignItems: 'center', marginTop: 40 },
  loadingText: { marginTop: 16, fontSize: 15, color: '${colors.muted}' },
  buttonGroup: { gap: 12 },
  button: { backgroundColor: '${colors.primary}', padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonOutline: { borderWidth: 1, borderColor: '${colors.primary}', padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '${colors.accent}', fontSize: 16, fontWeight: '500' },
  buttonOutlineText: { color: '${colors.primary}', fontSize: 16, fontWeight: '500' },
});`;

const appDir = path.join(__dirname, '..', 'mobile', 'app');
fs.writeFileSync(path.join(appDir, 'new-split.tsx'), newSplitScreen);
console.log('New split screen updated!');