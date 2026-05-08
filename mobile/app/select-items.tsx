import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BackButton from '../components/BackButton';

export default function SelectItemsScreen() {
  const { items, tax, tip, restaurantName, sessionId, isGuest } = useLocalSearchParams();
  const router = useRouter();

  const parsed = JSON.parse(items as string);
  const taxAmount = parseFloat(tax as string) || 0;
  const tipAmount = parseFloat(tip as string) || 0;
  const session = sessionId as string;

  const [itemList, setItemList] = useState(
    parsed.map((item: any) => ({
      ...item,
      quantity: item.quantity || 1,
      available: item.available !== undefined ? item.available : (item.quantity || 1),
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

  const getSubtotal = () =>
    itemList.reduce((sum: number, i: any) => sum + i.price * i.selectedQty, 0);

  const getReceiptSubtotal = () =>
    itemList.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);

  const getProportionalShare = (amount: number) => {
    const receiptSubtotal = getReceiptSubtotal();
    if (receiptSubtotal === 0) return 0;
    return (getSubtotal() / receiptSubtotal) * amount;
  };

  const getTotal = () => {
    return (getSubtotal() + getProportionalShare(taxAmount) + getProportionalShare(tipAmount)).toFixed(2);
  };

  const handleConfirm = async () => {
    const selected = itemList.filter((i: any) => i.selectedQty > 0);
    if (selected.length === 0) {
      Alert.alert('Select at least one item');
      return;
    }

  try {
      const selections = itemList
        .map((item: any, index: number) => ({ itemIndex: index, qty: item.selectedQty }))
        .filter((s: any) => s.qty > 0);

        console.log('Saving session:', session || Date.now(), 'items:', itemList.length);
      await fetch(`https://api.imsettled.app/api/sessions/api/session/${session || Date.now()}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selections,
          claimedBy: isGuest ? 'guest' : 'host',
          items: itemList,
          tax: taxAmount,
          tip: tipAmount,
          restaurantName: restaurantName as string,
          sessionId: session || Date.now().toString(),
        }),
      });
    } catch (error) {
      console.log('Could not save session:', error);
    }

    if (isGuest === 'true') {
     router.push({ pathname: '/payment', params: { total: getTotal(), items: JSON.stringify(selected), restaurantName: restaurantName as string } });
    } else {
   Alert.alert(
        `Your items: $${getTotal()}`,
        `Items claimed! Now invite your friend(s) to select what they ordered.`,
        [
          {
            text: '👥 Invite others',
            onPress: () => router.push({
              pathname: '/invite',
              params: {
                items: JSON.stringify(itemList),
                tax: taxAmount.toString(),
                tip: tipAmount.toString(),
                restaurantName: restaurantName as string,
                sessionId: session,
              },
            }),
          },
          { text: 'Done', onPress: () => router.replace('/home') },
          { text: 'Cancel' },
        ]
);
    }
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Select your items</Text>
      {restaurantName ? (
        <Text style={styles.restaurantName}>{restaurantName as string}</Text>
      ) : null}
      <Text style={styles.subtitle}>Choose how many of each you ordered</Text>
      <ScrollView style={styles.list}>
        {itemList.map((item: any, index: number) => {
          const isClaimed = item.available === 0;
          return (
            <View key={index} style={[styles.item, index % 2 === 0 ? styles.itemEven : styles.itemOdd, isClaimed && styles.itemClaimed, item.selectedQty > 0 && !isClaimed && styles.itemSelected]}>
              <View style={styles.itemTop}>
                <Text style={[styles.itemName, isClaimed && styles.itemNameClaimed]}>{item.name}</Text>
                <Text style={styles.itemPrice}>${item.price.toFixed(2)} each</Text>
              </View>
              {isClaimed ? (
                <Text style={styles.claimedLabel}>Already claimed</Text>
              ) : (
                <View style={styles.qtyRow}>
                  <Text style={styles.qtyLabel}>Qty:</Text>
                  {Array.from({ length: item.available + 1 }, (_, q) => (
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
                  {item.available < item.quantity && (
                    <Text style={styles.availableLabel}>{item.available} of {item.quantity} left</Text>
                  )}
                  {item.selectedQty > 0 && (
                    <Text style={styles.qtyTotal}>= ${(item.price * item.selectedQty).toFixed(2)}</Text>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {getSubtotal() > 0 && (taxAmount > 0 || tipAmount > 0) && (
          <View style={styles.breakdown}>
            <Text style={styles.breakdownTitle}>Your share breakdown</Text>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Items</Text>
              <Text style={styles.breakdownValue}>${getSubtotal().toFixed(2)}</Text>
            </View>
            {taxAmount > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Tax (proportional)</Text>
                <Text style={styles.breakdownValue}>${getProportionalShare(taxAmount).toFixed(2)}</Text>
              </View>
            )}
            {tipAmount > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Tip (proportional)</Text>
                <Text style={styles.breakdownValue}>${getProportionalShare(tipAmount).toFixed(2)}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Your total</Text>
          <Text style={styles.totalAmount}>${getTotal()}</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleConfirm}>
          <Text style={styles.buttonText}>Claim my items</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE0', paddingTop: 130 },
  title: { fontSize: 28, fontWeight: '600', color: '#1A4A3A', marginBottom: 4, paddingHorizontal: 24 },
  restaurantName: { fontSize: 24, fontWeight: '600', color: '#26705A', paddingHorizontal: 24, marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#6B7B6E', marginBottom: 24, paddingHorizontal: 24 },
  list: { flex: 1 },
  item: { paddingVertical: 14, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#EEE8D0' },
  itemEven: { backgroundColor: '#F2EDE0' },
  itemOdd: { backgroundColor: '#EEE8D0' },
  itemClaimed: { opacity: 0.4 },
  itemSelected: { opacity: 0.6, borderLeftWidth: 3, borderLeftColor: '#1A4A3A' },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  itemName: { fontSize: 15, color: '#1A1A1A', fontWeight: '500', flex: 1, marginRight: 8 },
  itemNameClaimed: { textDecorationLine: 'line-through' },
  itemPrice: { fontSize: 13, color: '#6B7B6E' },
  claimedLabel: { fontSize: 13, color: '#6B7B6E', fontStyle: 'italic' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  qtyLabel: { fontSize: 13, color: '#6B7B6E', marginRight: 4 },
  qtyButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#EEE8D0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  qtyButtonSelected: { backgroundColor: '#1A4A3A', borderColor: '#1A4A3A' },
  qtyButtonText: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  qtyButtonTextSelected: { color: '#F0D080' },
  availableLabel: { fontSize: 12, color: '#E8923A', fontWeight: '500' },
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
});