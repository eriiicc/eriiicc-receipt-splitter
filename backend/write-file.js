const fs = require('fs');
const path = require('path');

const code = `import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import BackButton from '../components/BackButton';

export default function HistoryScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchSessions = () => {
    fetch('https://api.imsettled.app/api/sessions')
      .then(r => r.json())
      .then(data => {
        setSessions(data.sessions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const formatDate = (timestamp) => {
    return new Date(parseInt(timestamp)).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const isComplete = (items) => {
    if (!items || items.length === 0) return false;
    return items.every(item => item.available === 0);
  };

  const getTotal = (items) => {
    if (!items) return 0;
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleLongPress = (session) => {
    Alert.alert(
      'Delete Split',
      \`Delete this split from \${session.restaurantName || 'Unknown restaurant'}?\`,
      [
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(\`https://api.imsettled.app/api/session/\${session.id}\`, {
                method: 'DELETE',
              });
              setSessions(prev => prev.filter(s => s.id !== session.id));
            } catch (error) {
              Alert.alert('Error', 'Could not delete split');
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Split History</Text>
      <Text style={styles.subtitle}>Long press a split to delete</Text>

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
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => router.push({ pathname: '/split-detail', params: { sessionId: session.id } })}
              onLongPress={() => handleLongPress(session)}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.cardRestaurant}>{session.restaurantName || 'Unknown restaurant'}</Text>
                <Text style={styles.cardDate}>{formatDate(session.createdAt)}</Text>
                <View style={[styles.statusBadge, isComplete(session.items) ? styles.statusComplete : styles.statusPending]}>
                  <Text style={[styles.statusText, isComplete(session.items) ? styles.statusTextComplete : styles.statusTextPending]}>
                    {isComplete(session.items) ? '✓ Settled' : '⏳ Pending'}
                  </Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardTotal}>\${getTotal(session.items).toFixed(2)}</Text>
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
  subtitle: { fontSize: 13, color: '#6B7B6E', marginBottom: 24, paddingHorizontal: 24 },
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
  statusBadge: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' },
  statusComplete: { backgroundColor: '#E8F5E9' },
  statusPending: { backgroundColor: '#FFF8E1' },
  statusText: { fontSize: 12, fontWeight: '500' },
  statusTextComplete: { color: '#26705A' },
  statusTextPending: { color: '#E8923A' },
});`;

fs.writeFileSync(path.join(__dirname, '..', 'mobile', 'app', 'history.tsx'), code);
console.log('Done!');