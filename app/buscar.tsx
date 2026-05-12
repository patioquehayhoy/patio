import { router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

export default function BuscarScreen() {
  useEffect(() => {
    router.replace('/explorar');
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
    </View>
  );
}
