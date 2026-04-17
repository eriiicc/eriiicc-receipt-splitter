import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function BackButton() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
        <Text style={styles.arrow}>←</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 72,
    left: 24,
    zIndex: 100,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEE8D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 20,
    color: '#1A4A3A',
    fontWeight: '500',
  },
});