import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import BackButton from '../components/BackButton';

export default function HistoryScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('https://eriiicc-receipt-splitter-production.up.railway.app/api/sessions')
      .then(r => r.json())
      .then(data => {
        setSessions(data.sessions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const getTotal = (items) => {
    if (!items) return 0;
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Split History</Text>
      <Text style={styles.subtitle}>Your past splits</Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#1A4A3A" />
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🧾</Text>
          <Text style={styles.emptyTitle}>No splits yet</Text>
          <Text style={styles.emptySubtitle}>Your split history will appear here</Text>
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {sessions.map((session, index) => (
            <TouchableOpacity key={index} style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardRestaurant}>{session.restaurantName || 'Unknown restaurant'}</Text>
                <Text style={styles.cardDate}>{formatDate(session.createdAt)}</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardTotal}>${getTotal(session.items).toFixed(2)}</Text>
                <Text style={styles.cardItems}>{session.items?.length || 0} items</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE0', paddingTop: 130 },
  title: { fontSize: 28, fontWeight: '600', color: '#1A4A3A', marginBottom: 8, paddingHorizontal: 24 },
  subtitle: { fontSize: 15, color: '#6B7B6E', marginBottom: 24, paddingHorizontal: 24 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#1A4A3A', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#6B7B6E', textAlign: 'center' },
  list: { flex: 1, paddingHorizontal: 24 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EEE8D0' },
  cardLeft: { flex: 1 },
  cardRestaurant: { fontSize: 16, fontWeight: '500', color: '#1A4A3A', marginBottom: 4 },
  cardDate: { fontSize: 13, color: '#6B7B6E' },
  cardRight: { alignItems: 'flex-end' },
  cardTotal: { fontSize: 18, fontWeight: '600', color: '#1A4A3A', marginBottom: 2 },
  cardItems: { fontSize: 13, color: '#6B7B6E' },
});