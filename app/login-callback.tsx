import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { Linking } from 'react-native'

export default function LoginCallback() {
  const router = useRouter()

  useEffect(() => {
    Linking.getInitialURL().then(async (url) => {
      if (url) {
        const { data, error } = await supabase.auth.getSessionFromUrl({ url } as any)
        if (data?.session?.user?.email) {
          router.replace('/menu')
        } else {
          router.replace('/')
        }
      } else {
        router.replace('/')
      }
    })
  }, [])

  return null
}
