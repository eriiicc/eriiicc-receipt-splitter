import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, FlatList, Modal, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Contacts from 'expo-contacts';
import BackButton from '../components/BackButton';

export default function InviteScreen() {
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState([]);
  const [sending, setSending] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { items, tax, tip, restaurantName } = useLocalSearchParams();
  const paymentInfoRef = useRef({});
  
  useEffect(() => {
    AsyncStorage.getItem('paymentInfo').then(val => {
      if (val) paymentInfoRef.current = JSON.parse(val);
    });
  }, []);

const openContacts = async () => {
    setContacts([]);
    setSearchQuery('');

    const { status } = await Contacts.requestPermissionsAsync();
    
    if (status === 'granted') {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name, Contacts.Fields.Emails],
        sort: Contacts.SortTypes.FirstName,
      });
      const withPhones = data
        .filter(c => c.phoneNumbers && c.phoneNumbers.length > 0)
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setContacts(withPhones);
      setShowContacts(true);
      return;
    }

    Alert.alert(
      'Import from Contacts',
      'Settled needs contacts access to help you invite people. Your contacts are never stored.',
      [
        { text: 'Continue', onPress: async () => {
            const { status: newStatus } = await Contacts.requestPermissionsAsync();
            if (newStatus !== 'granted') {
              Alert.alert('Permission needed', 'Go to Settings → Privacy → Contacts to allow access');
              return;
            }
            const { data } = await Contacts.getContactsAsync({
              fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name, Contacts.Fields.Emails],
              sort: Contacts.SortTypes.FirstName,
            });
            const withPhones = data
              .filter(c => c.phoneNumbers && c.phoneNumbers.length > 0)
              .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setContacts(withPhones);
            setShowContacts(true);
          }
        },
        { text: 'Cancel' }
      ]
    );
  };

 const selectContact = (contact) => {
    const rawPhone = contact.phoneNumbers[0].number.replace(/\D/g, '');
    const phone10 = rawPhone.slice(-10);
    const already = guests.some(g => g.phone === '+1' + phone10);
    if (already) {
      Alert.alert('Already added', `${contact.name} is already in your list`);
      return;
    }
    setGuests(prev => [...prev, { phone: '+1' + phone10, name: contact.name }]);
    Alert.alert('Added!', `${contact.name} added to your list`);
  };

  const addManual = () => {
    if (phone.length < 10) {
      Alert.alert('Please enter a valid 10 digit phone number');
      return;
    }
    const already = guests.some(g => g.phone === '+1' + phone);
    if (already) {
      Alert.alert('Already added', 'This number is already in your list');
      return;
    }
    setGuests([...guests, { phone: '+1' + phone, name: phone }]);
    setPhone('');
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
        await fetch('https://api.imsettled.app/api/send-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            phoneNumber: guest.phone,
            senderName: 'Your friend',
            sessionId,
            items: JSON.parse(items as string),
            tax: parseFloat(tax as string) || 0,
            tip: parseFloat(tip as string) || 0,
            restaurantName: restaurantName as string,
            guestLink: `https://api.imsettled.app/guest?session=${sessionId}`,
            paymentInfo: paymentInfoRef.current,
          }),
        });
      }
      
      const guestLink = `https://api.imsettled.app/guest?session=${sessionId}`;
      Alert.alert(
        'Invites sent!',
        `Sent to ${guests.length} guest${guests.length > 1 ? 's' : ''}. Share the link to invite more people.`,
        [
          {
            text: 'Share link',
            onPress: async () => {
              await Share.share({
                message: `${restaurantName ? restaurantName + ' - ' : ''}Split the bill with me on Settled! Select your items here: ${guestLink}`,
                url: guestLink,
              });
            }
          },
          {
            text: 'Copy link',
            onPress: async () => {
              await Clipboard.setStringAsync(guestLink);
              Alert.alert('Copied!', 'Guest link copied to clipboard');
            }
          },
          { text: 'Done', onPress: () => router.replace('/home') }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Could not send invites');
    } finally {
      setSending(false);
    }
  };

  const filteredContacts = contacts.filter(c =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <BackButton />
      <ScrollView keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Invite guests</Text>
        <Text style={styles.subtitle}>Add people to split with</Text>

        <View style={styles.inputGroup}>
          <View style={styles.phoneRow}>
            <TextInput
              style={styles.input}
              placeholder="Phone number (10 digits)"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={10}
              placeholderTextColor="#6B7B6E"
            />
            <TouchableOpacity style={styles.addButton} onPress={addManual}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.contactsButton} onPress={openContacts}>
            <Text style={styles.contactsButtonText}>+ Import from Contacts</Text>
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
                <View style={{ flex: 1 }}>
                  <Text style={styles.guestName}>{guest.name}</Text>
                  <Text style={styles.guestPhone}>{guest.phone}</Text>
                </View>
                <TouchableOpacity onPress={() => setGuests(guests.filter((_, i) => i !== index))}>
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

      <Modal visible={showContacts} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select a contact</Text>
            <TouchableOpacity onPress={() => setShowContacts(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            placeholderTextColor="#6B7B6E"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const rawPhone = item.phoneNumbers[0].number.replace(/\D/g, '');
              const phone10 = rawPhone.slice(-10);
              const isAdded = guests.some(g => g.phone === '+1' + phone10);
              return (
                <TouchableOpacity 
                  style={[styles.contactRow, isAdded && styles.contactRowAdded]} 
                  onPress={() => selectContact(item)}
                >
                  <View style={[styles.contactAvatar, isAdded && styles.contactAvatarAdded]}>
                    <Text style={styles.contactAvatarText}>
                      {(item.name || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    <Text style={styles.contactPhone}>{item.phoneNumbers[0].number}</Text>
                  </View>
                  {isAdded && <Text style={styles.addedBadge}>Added</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE0', paddingTop: 130 },
  title: { fontSize: 28, fontWeight: '600', color: '#1A4A3A', marginBottom: 8, paddingHorizontal: 24 },
  subtitle: { fontSize: 15, color: '#6B7B6E', marginBottom: 24, paddingHorizontal: 24 },
  contactRowAdded: { opacity: 0.6 },
  contactAvatarAdded: { backgroundColor: '#1A4A3A' },
  addedBadge: { fontSize: 12, color: '#26705A', fontWeight: '500' },
  inputGroup: { paddingHorizontal: 24, gap: 12, marginBottom: 24 },
  phoneRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, height: 50, borderWidth: 1, borderColor: '#EEE8D0', borderRadius: 10, paddingHorizontal: 16, fontSize: 16, backgroundColor: '#fff', color: '#1A1A1A' },
  addButton: { backgroundColor: '#1A4A3A', paddingHorizontal: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#F0D080', fontSize: 15, fontWeight: '500' },
  contactsButton: { borderWidth: 1, borderColor: '#1A4A3A', padding: 14, borderRadius: 10, alignItems: 'center' },
  contactsButtonText: { color: '#1A4A3A', fontSize: 15, fontWeight: '500' },
  guestList: { paddingHorizontal: 24 },
  guestListTitle: { fontSize: 15, fontWeight: '500', color: '#1A4A3A', marginBottom: 12 },
  guestRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE8D0', gap: 12 },
  guestAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEE8D0', alignItems: 'center', justifyContent: 'center' },
  guestAvatarText: { fontSize: 16, fontWeight: '500', color: '#1A4A3A' },
  guestName: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  guestPhone: { fontSize: 13, color: '#6B7B6E' },
  removeButtonText: { fontSize: 13, color: '#E24B4A' },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#EEE8D0' },
  button: { backgroundColor: '#1A4A3A', padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#6B7B6E' },
  buttonText: { color: '#F0D080', fontSize: 16, fontWeight: '500' },
  modalContainer: { flex: 1, backgroundColor: '#F2EDE0' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#EEE8D0' },
  modalTitle: { fontSize: 20, fontWeight: '600', color: '#1A4A3A' },
  modalClose: { fontSize: 16, color: '#26705A', fontWeight: '500' },
  searchInput: { margin: 16, height: 44, borderWidth: 1, borderColor: '#EEE8D0', borderRadius: 10, paddingHorizontal: 16, backgroundColor: '#fff', color: '#1A1A1A' },
  contactRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEE8D0', gap: 12 },
  contactAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEE8D0', alignItems: 'center', justifyContent: 'center' },
  contactAvatarText: { fontSize: 16, fontWeight: '500', color: '#1A4A3A' },
  contactName: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  contactPhone: { fontSize: 13, color: '#6B7B6E' },
});