import { useEffect } from 'react'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { View, Text, ActivityIndicator } from 'react-native'

export default function LoginCallback() {
  useEffect(() => {
    console.log('=== LOGIN CALLBACK MONTADO ===')
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('=== AUTH EVENT:', event)
      console.log('=== SESSION:', session?.user?.email)
      if (event === 'SIGNED_IN' && session?.user?.email) {
        router.replace('/menu')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: '#FF5E00', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#FFF7E0', fontSize: 28, fontWeight: '900' }}>PATIO</Text>
      <ActivityIndicator color="#FFF7E0" style={{ marginTop: 24 }} />
    </View>
  )
}
