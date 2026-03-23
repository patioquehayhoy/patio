import { useEffect } from 'react'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { View, Text, ActivityIndicator } from 'react-native'
import { upsertFondita } from '@/lib/db'

export default function LoginCallback() {
  useEffect(() => {
    const check = async () => {
      await new Promise(r => setTimeout(r, 1500))
      const { data } = await supabase.auth.getSession()
      if (data.session?.user?.email) {
        await upsertFondita(data.session.user.email)
        router.replace('/menu')
      } else {
        router.replace('/')
      }
    }
    check()
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: '#FF5E00', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#FFF7E0', fontSize: 28, fontWeight: '900' }}>PATIO</Text>
      <ActivityIndicator color="#FFF7E0" style={{ marginTop: 24 }} />
    </View>
  )
}
