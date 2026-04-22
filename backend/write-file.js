const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '..', 'mobile', 'app');

const selectItemsScreen = `import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BackButton from '../components/BackButton';

export default function SelectItemsScreen() {
  const { items } = useLocalSearchParams();
  const router = useRouter();

  const parsed = JSON.parse(items as string);
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

  const getTotal = () => {
    return itemList
      .reduce((sum: number, i: any) => sum + i.price * i.selectedQty, 0)
      .toFixed(2);
  };

  const handleConfirm = () => {
    const selected = itemList.filter((i: any) => i.selectedQty > 0);
    if (selected.length === 0) {
      Alert.alert('Select at least one item');
      return;
    }
    const total = itemList
      .reduce((sum: number, i: any) => sum + i.price * i.selectedQty, 0)
      .toFixed(2);
    router.push({ pathname: '/payment', params: { total, items: JSON.stringify(selected) } });
  };

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
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#EEE8D0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  totalLabel: { fontSize: 16, color: '#6B7B6E' },
  totalAmount: { fontSize: 22, fontWeight: '600', color: '#1A4A3A' },
  button: { backgroundColor: '#1A4A3A', padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#F0D080', fontSize: 16, fontWeight: '500' },
});`;

fs.writeFileSync(path.join(appDir, 'select-items.tsx'), selectItemsScreen);
console.log('Done! select-items.tsx updated with quantity selection.');