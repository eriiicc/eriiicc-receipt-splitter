const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '..', 'mobile', 'app');

const newSplitScreen = `import { useState } from 'react';
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

  const selectItemsScreen = `import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BackButton from '../components/BackButton';

export default function SelectItemsScreen() {
  const { items, tax, tip } = useLocalSearchParams();
  const router = useRouter();

  const parsed = JSON.parse(items as string);
  const taxAmount = parseFloat(tax as string) || 0;
  const tipAmount = parseFloat(tip as string) || 0;

  const [itemList, setItemList] = useState(
    parsed.map((item: any) => ({
      ...item,
      quantity: item.quantity || 1,
      selectedQty: 0,
    }))
  );

  const setQty = (index: number, qty: number) => {
    setItemList((prev: any) =>
      prev.map((item: any, i: number) =>
        i === index ? { ...item, selectedQty: qty } : item
      )
    );
  };

  const getSubtotal = () => {
    return itemList.reduce((sum: number, i: any) => sum + i.price * i.selectedQty, 0);
  };

  const getReceiptSubtotal = () => {
    return itemList.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
  };

  const getProportionalShare = (amount: number) => {
    const receiptSubtotal = getReceiptSubtotal();
    if (receiptSubtotal === 0) return 0;
    return (getSubtotal() / receiptSubtotal) * amount;
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    const myTax = getProportionalShare(taxAmount);
    const myTip = getProportionalShare(tipAmount);
    return (subtotal + myTax + myTip).toFixed(2);
  };

  const handleConfirm = () => {
    const selected = itemList.filter((i: any) => i.selectedQty > 0);
    if (selected.length === 0) {
      Alert.alert('Select at least one item');
      return;
    }
    router.push({ pathname: '/payment', params: { total: getTotal(), items: JSON.stringify(selected) } });
  };

  const myTax = getProportionalShare(taxAmount);
  const myTip = getProportionalShare(tipAmount);

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Select your items</Text>
      <Text style={styles.subtitle}>Choose how many of each you ordered</Text>
      <ScrollView style={styles.list}>
        {itemList.map((item: any, index: number) => (
          <View key={index} style={[styles.item, index % 2 === 0 ? styles.itemEven : styles.itemOdd]}>
            <View style={styles.itemTop}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>\${item.price.toFixed(2)} each</Text>
            </View>
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Qty:</Text>
              {Array.from({ length: item.quantity + 1 }, (_, q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.qtyButton, item.selectedQty === q && styles.qtyButtonSelected]}
                  onPress={() => setQty(index, q)}
                >
                  <Text style={[styles.qtyButtonText, item.selectedQty === q && styles.qtyButtonTextSelected]}>
                    {q}
                  </Text>
                </TouchableOpacity>
              ))}
              {item.selectedQty > 0 && (
                <Text style={styles.qtyTotal}>= \${(item.price * item.selectedQty).toFixed(2)}</Text>
              )}
            </View>
          </View>
        ))}

        {getSubtotal() > 0 && (taxAmount > 0 || tipAmount > 0) && (
          <View style={styles.breakdown}>
            <Text style={styles.breakdownTitle}>Your share breakdown</Text>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Items</Text>
              <Text style={styles.breakdownValue}>\${getSubtotal().toFixed(2)}</Text>
            </View>
            {taxAmount > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Tax (proportional)</Text>
                <Text style={styles.breakdownValue}>\${myTax.toFixed(2)}</Text>
              </View>
            )}
            {tipAmount > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Tip (proportional)</Text>
                <Text style={styles.breakdownValue}>\${myTip.toFixed(2)}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Your total</Text>
          <Text style={styles.totalAmount}>\${getTotal()}</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleConfirm}>
          <Text style={styles.buttonText}>Confirm selection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE0', paddingTop: 130 },
  title: { fontSize: 28, fontWeight: '600', color: '#1A4A3A', marginBottom: 8, paddingHorizontal: 24 },
  subtitle: { fontSize: 15, color: '#6B7B6E', marginBottom: 24, paddingHorizontal: 24 },
  list: { flex: 1 },
  item: { paddingVertical: 14, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#EEE8D0' },
  itemEven: { backgroundColor: '#F2EDE0' },
  itemOdd: { backgroundColor: '#EEE8D0' },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  itemName: { fontSize: 15, color: '#1A1A1A', fontWeight: '500', flex: 1, marginRight: 8 },
  itemPrice: { fontSize: 13, color: '#6B7B6E' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  qtyLabel: { fontSize: 13, color: '#6B7B6E', marginRight: 4 },
  qtyButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#EEE8D0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  qtyButtonSelected: { backgroundColor: '#1A4A3A', borderColor: '#1A4A3A' },
  qtyButtonText: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  qtyButtonTextSelected: { color: '#F0D080' },
  qtyTotal: { fontSize: 13, color: '#1A4A3A', fontWeight: '500', marginLeft: 4 },
  breakdown: { margin: 24, padding: 16, backgroundColor: '#EEE8D0', borderRadius: 12 },
  breakdownTitle: { fontSize: 14, fontWeight: '500', color: '#1A4A3A', marginBottom: 12 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  breakdownLabel: { fontSize: 14, color: '#6B7B6E' },
  breakdownValue: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#EEE8D0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  totalLabel: { fontSize: 16, color: '#6B7B6E' },
  totalAmount: { fontSize: 22, fontWeight: '600', color: '#1A4A3A' },
  button: { backgroundColor: '#1A4A3A', padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#F0D080', fontSize: 16, fontWeight: '500' },
});`;

  const navigateToItems = (data) => {
    const items = data.items && data.items.length > 0
      ? data.items
      : [{ name: 'Could not read receipt', price: 0.00, quantity: 1 }];
    const tax = data.tax || 0;
    const tip = data.tip || 0;
    router.push({
      pathname: '/select-items',
      params: { items: JSON.stringify(items), tax: tax.toString(), tip: tip.toString() },
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
});`;

fs.writeFileSync(path.join(appDir, 'new-split.tsx'), newSplitScreen);
fs.writeFileSync(path.join(appDir, 'select-items.tsx'), selectItemsScreen);
console.log('Done! Both files updated.');