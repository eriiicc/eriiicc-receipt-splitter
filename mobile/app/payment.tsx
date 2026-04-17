import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PaymentScreen() {
  const { total, name } = useLocalSearchParams();
  const router = useRouter();
  const amount = parseFloat(total as string).toFixed(2);

  const openVenmo = () => {
    const url = `venmo://paycharge?txn=pay&recipients=eric-graf-50&amount=${amount}&note=Receipt+split`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://venmo.com/eric-graf-50?txn=pay&amount=${amount}&note=Receipt+split`);
      }
    });
  };

 const openCashApp = () => {
  const url = `cashapp://cash.app/pay/$ericg`;
  Linking.canOpenURL(url).then(supported => {
    if (supported) {
      Alert.alert(
        'Opening Cash App',
        `Send $${amount} to $ericg`,
        [{ text: 'Open Cash App', onPress: () => Linking.openURL(url) },
         { text: 'Cancel' }]
      );
    } else {
      Linking.openURL(`https://cash.app/$ericg`);
    }
  });
};

  const openZelle = () => {
    Linking.openURL('https://enroll.zellepay.com').catch(() => {
      Alert.alert('Zelle', 'Please open your banking app and send payment via Zelle');
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pay your share</Text>
      <Text style={styles.subtitle}>Choose how you want to pay</Text>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Your total</Text>
        <Text style={styles.totalAmount}>${amount}</Text>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={[styles.button, styles.venmo]} onPress={openVenmo}>
          <Text style={styles.buttonText}>Pay with Venmo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.cashapp]} onPress={openCashApp}>
          <Text style={styles.buttonText}>Pay with Cash App</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.zelle]} onPress={openZelle}>
          <Text style={styles.buttonText}>Pay with Zelle</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.doneButton} onPress={() => router.replace('/home')}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 64 },
  title: { fontSize: 28, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#888', marginBottom: 32 },
  totalCard: { backgroundColor: '#F5F4FF', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 32 },
  totalLabel: { fontSize: 15, color: '#534AB7', marginBottom: 8 },
  totalAmount: { fontSize: 48, fontWeight: '600', color: '#534AB7' },
  buttonGroup: { gap: 12, marginBottom: 24 },
  button: { padding: 16, borderRadius: 10, alignItems: 'center' },
  venmo: { backgroundColor: '#008CFF' },
  cashapp: { backgroundColor: '#00D632' },
  zelle: { backgroundColor: '#6D1ED4' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  doneButton: { borderWidth: 1, borderColor: '#ddd', padding: 16, borderRadius: 10, alignItems: 'center' },
  doneButtonText: { fontSize: 16, color: '#888' },
});