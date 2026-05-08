const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '..', 'mobile', 'app');

const splitDetailScreen = `import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import BackButton from '../components/BackButton';

export default function SplitDetailScreen() {
  const { sessionId } = useLocalSearchParams();
  const [session, setSession] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(\`https://api.imsettled.app/api/sessions/api/session/\${sessionId}\`)
      .then(r => r.json())
      .then(data => {
        setSession(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getTotal = () => {
    if (!session?.items) return 0;
    return session.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getClaimedTotal = () => {
    if (!session?.items) return 0;
    return session.items.reduce((sum, item) => sum + item.price * (item.claimed || 0), 0);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <BackButton />
        <ActivityIndicator size="large" color="#1A4A3A" style={{ marginTop: 100 }} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <BackButton />
        <Text style={styles.error}>Session not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackButton />
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.restaurant}>{session.restaurantName || 'Unknown restaurant'}</Text>
          <Text style={styles.date}>{formatDate(session.createdAt)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Bill total</Text>
            <Text style={styles.summaryAmount}>\${getTotal().toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Claimed</Text>
            <Text style={[styles.summaryAmount, { color: '#26705A' }]}>\${getClaimedTotal().toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text style={[styles.summaryAmount, { color: '#E8923A' }]}>\${(getTotal() - getClaimedTotal()).toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {session.items?.map((item, index) => (
            <View key={index} style={[styles.item, index % 2 === 0 ? styles.itemEven : styles.itemOdd]}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>qty: {item.quantity}</Text>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.itemPrice}>\${(item.price * item.quantity).toFixed(2)}</Text>
                {item.claimed > 0 && (
                  <Text style={styles.itemClaimed}>{item.claimed} claimed</Text>
                )}
                {item.available === 0 && (
                  <Text style={styles.itemFullyClaimed}>✓ all claimed</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {(session.tax > 0 || session.tip > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Charges</Text>
            {session.tax > 0 && (
              <View style={styles.chargeRow}>
                <Text style={styles.chargeLabel}>Tax</Text>
                <Text style={styles.chargeAmount}>\${session.tax.toFixed(2)}</Text>
              </View>
            )}
            {session.tip > 0 && (
              <View style={styles.chargeRow}>
                <Text style={styles.chargeLabel}>Tip</Text>
                <Text style={styles.chargeAmount}>\${session.tip.toFixed(2)}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE0', paddingTop: 130 },
  error: { fontSize: 16, color: '#6B7B6E', textAlign: 'center', marginTop: 40 },
  header: { paddingHorizontal: 24, marginBottom: 20 },
  restaurant: { fontSize: 26, fontWeight: '600', color: '#1A4A3A', marginBottom: 4 },
  date: { fontSize: 14, color: '#6B7B6E' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 10, marginBottom: 24 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#EEE8D0' },
  summaryLabel: { fontSize: 12, color: '#6B7B6E', marginBottom: 4 },
  summaryAmount: { fontSize: 18, fontWeight: '600', color: '#1A4A3A' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '500', color: '#6B7B6E', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 24, marginBottom: 8 },
  item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 24 },
  itemEven: { backgroundColor: '#F2EDE0' },
  itemOdd: { backgroundColor: '#EEE8D0' },
  itemLeft: { flex: 1 },
  itemName: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  itemQty: { fontSize: 13, color: '#6B7B6E', marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  itemPrice: { fontSize: 15, fontWeight: '600', color: '#1A4A3A' },
  itemClaimed: { fontSize: 12, color: '#26705A', marginTop: 2 },
  itemFullyClaimed: { fontSize: 12, color: '#26705A', fontWeight: '500', marginTop: 2 },
  chargeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EEE8D0' },
  chargeLabel: { fontSize: 15, color: '#1A1A1A' },
  chargeAmount: { fontSize: 15, fontWeight: '500', color: '#1A4A3A' },
});`;

fs.writeFileSync(path.join(appDir, 'split-detail.tsx'), splitDetailScreen);
console.log('Done! split-detail.tsx created.');