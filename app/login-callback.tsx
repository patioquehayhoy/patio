import { useEffect } from 'react'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { View, Text, ActivityIndicator, Linking } from 'react-native'

export default function LoginCallback() {
  useEffect(() => {
    const processUrl = async (url: string | null) => {
      if (!url) {
        router.replace('/')
        return
      }
      const code = new URL(url).searchParams.get('code')
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error && data.session?.user?.email) {
          router.replace('/menu')
          return
        }
      }
      router.replace('/')
    }
    Linking.getInitialURL().then(processUrl)
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: '#FF5E00', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#FFF7E0', fontSize: 28, fontWeight: '900' }}>PATIO</Text>
      <ActivityIndicator color="#FFF7E0" style={{ marginTop: 24 }} />
    </View>
  )
}
