import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function InviteScreen() {
  const { items } = useLocalSearchParams();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [guests, setGuests] = useState([]);
  const [sending, setSending] = useState(false);
  const router = useRouter();

  const addGuest = () => {
    if (phone.length < 10) {
      Alert.alert('Please enter a valid phone number');
      return;
    }
    if (name.length < 1) {
      Alert.alert('Please enter a name for this guest');
      return;
    }
    setGuests([...guests, { phone: '+1' + phone, name }]);
    setPhone('');
    setName('');
  };

  const sendInvites = async () => {
    if (guests.length === 0) {
      Alert.alert('Add at least one guest');
      return;
    }
    try {
      setSending(true);
      const sessionId = Date.now().toString();
      for (const guest of guests) {
        await fetch('http://192.168.0.170:3000/api/send-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: guest.phone,
            senderName: 'Your friend',
            sessionId,
          }),
        });
      }
      Alert.alert(
        'Invites sent!',
        `Sent to ${guests.length} guest${guests.length > 1 ? 's' : ''}`,
        [{ text: 'OK', onPress: () => router.replace('/home') }]
      );
    } catch (error) {
      Alert.alert('Error', 'Could not send invites');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView>
        <Text style={styles.title}>Invite guests</Text>
        <Text style={styles.subtitle}>Add people to split with</Text>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Guest name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone number (10 digits)"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={10}
          />
          <TouchableOpacity style={styles.addButton} onPress={addGuest}>
            <Text style={styles.addButtonText}>+ Add guest</Text>
          </TouchableOpacity>
        </View>

        {guests.length > 0 && (
          <View style={styles.guestList}>
            <Text style={styles.guestListTitle}>Guests ({guests.length})</Text>
            {guests.map((guest, index) => (
              <View key={index} style={styles.guestRow}>
                <View style={styles.guestAvatar}>
                  <Text style={styles.guestAvatarText}>
                    {guest.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.guestName}>{guest.name}</Text>
                  <Text style={styles.guestPhone}>{guest.phone}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setGuests(guests.filter((_, i) => i !== index))}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, sending && styles.buttonDisabled]}
          onPress={sendInvites}
          disabled={sending}
        >
          <Text style={styles.buttonText}>
            {sending ? 'Sending...' : `Send ${guests.length} invite${guests.length !== 1 ? 's' : ''}`}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 64 },
  title: { fontSize: 28, fontWeight: '600', color: '#1a1a1a', marginBottom: 8, paddingHorizontal: 24 },
  subtitle: { fontSize: 15, color: '#888', marginBottom: 24, paddingHorizontal: 24 },
  inputGroup: { paddingHorizontal: 24, gap: 12, marginBottom: 24 },
  input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 16, fontSize: 16 },
  addButton: { borderWidth: 1, borderColor: '#534AB7', padding: 14, borderRadius: 10, alignItems: 'center' },
  addButtonText: { color: '#534AB7', fontSize: 16, fontWeight: '500' },
  guestList: { paddingHorizontal: 24 },
  guestListTitle: { fontSize: 15, fontWeight: '500', color: '#1a1a1a', marginBottom: 12 },
  guestRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 12 },
  guestAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEEDFE', alignItems: 'center', justifyContent: 'center' },
  guestAvatarText: { fontSize: 16, fontWeight: '500', color: '#534AB7' },
  guestName: { fontSize: 15, fontWeight: '500', color: '#1a1a1a' },
  guestPhone: { fontSize: 13, color: '#888' },
  removeButton: { marginLeft: 'auto' },
  removeButtonText: { fontSize: 13, color: '#E24B4A' },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  button: { backgroundColor: '#534AB7', padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#9992D4' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
});