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
      const { data, error } = await supabase.auth.getSessionFromUrl({ url } as any)
      if (data?.session?.user?.email) {
        router.replace('/menu')
      } else {
        setTimeout(async () => {
          const { data: s } = await supabase.auth.getSession()
          if (s.session?.user?.email) {
            router.replace('/menu')
          } else {
            router.replace('/')
          }
        }, 3000)
      }
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
