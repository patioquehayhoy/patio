import { useEffect } from 'react'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function LoginCallback() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email) {
        router.replace('/menu')
      } else {
        router.replace('/')
      }
    })
  }, [])
  return null
}
