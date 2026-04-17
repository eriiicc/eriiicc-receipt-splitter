import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BackButton from '../components/BackButton';

export default function SelectItemsScreen() {
  const { items } = useLocalSearchParams();
  const router = useRouter();
  const parsed = JSON.parse(items as string);
  const [itemList, setItemList] = useState(parsed.map((item: any) => ({ ...item, selected: false })));

  const toggleItem = (index: number) => {
    setItemList((prev: any) => prev.map((item: any, i: number) => i === index ? { ...item, selected: !item.selected } : item));
  };

  const getTotal = () => itemList.filter((i: any) => i.selected).reduce((sum: number, i: any) => sum + i.price, 0).toFixed(2);

  const handleConfirm = () => {
    const selected = itemList.filter((i: any) => i.selected);
    if (selected.length === 0) { Alert.alert('Select at least one item'); return; }
    const total = selected.reduce((sum: number, i: any) => sum + i.price, 0).toFixed(2);
    router.push({ pathname: '/payment', params: { total, items: JSON.stringify(selected) } });
  };

  return (
    <View style={styles.container}>
        <BackButton />
      <Text style={styles.title}>Select your items</Text>
      <Text style={styles.subtitle}>Tap everything you ordered</Text>
      <ScrollView style={styles.list}>
        {itemList.map((item: any, index: number) => (
          <TouchableOpacity key={index} style={[styles.item, index % 2 === 0 ? styles.itemEven : styles.itemOdd, item.selected && styles.itemSelected]} onPress={() => toggleItem(index)}>
            <View style={styles.itemLeft}>
              <View style={[styles.checkbox, item.selected && styles.checkboxSelected]}>
                {item.selected && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.itemName, item.selected && styles.itemNameSelected]}>{item.name}</Text>
            </View>
            <Text style={[styles.itemPrice, item.selected && styles.itemPriceSelected]}>${item.price.toFixed(2)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Your total</Text>
          <Text style={styles.totalAmount}>${getTotal()}</Text>
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
  list: { flex: 1, paddingHorizontal: 24 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#EEE8D0' },
itemEven: { backgroundColor: '#F2EDE0' },
itemOdd: { backgroundColor: '#EEE8D0' },
  itemSelected: { backgroundColor: '#EEE8D0', marginHorizontal: -24, paddingHorizontal: 24 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#c9af49', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: '#1A4A3A', borderColor: '#1A4A3A' },
  checkmark: { color: '#F0D080', fontSize: 13, fontWeight: '600' },
  itemName: { fontSize: 15, color: '#1A1A1A', flex: 1 },
  itemNameSelected: { color: '#1A4A3A', fontWeight: '500' },
  itemPrice: { fontSize: 15, color: '#6B7B6E' },
  itemPriceSelected: { color: '#1A4A3A', fontWeight: '500' },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#EEE8D0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  totalLabel: { fontSize: 16, color: '#6B7B6E' },
  totalAmount: { fontSize: 22, fontWeight: '600', color: '#1A4A3A' },
  button: { backgroundColor: '#1A4A3A', padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#F0D080', fontSize: 16, fontWeight: '500' },
});