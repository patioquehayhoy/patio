import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AgentSpinner } from './agent-spinner';
import { EMAIL_CODE_LENGTH, verifyEmailCode } from '@/lib/auth-email-code';
import { signedInDestination } from '@/lib/auth-destination';
import { withSessionLock } from '@/lib/session-queue';
import { noWidow } from '@/lib/typography';

export function EmailCodeForm({ email, role, onResend }: {
  email: string; role: 'foodie' | 'fondero'; onResend: () => Promise<boolean>;
}) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retryAt, setRetryAt] = useState(() => Date.now() + 60000);
  const [remaining, setRemaining] = useState(60);
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    const update = () => setRemaining(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [retryAt]);

  const verify = async () => {
    if (pending.current || code.length !== EMAIL_CODE_LENGTH) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await withSessionLock(async () => {
        const session = await verifyEmailCode(email, code);
        const destination = await signedInDestination(session, role);
        if (mounted.current) router.replace(destination as never);
      });
    } catch (reason) {
      if (mounted.current) setError(reason instanceof Error ? reason.message : 'Inténtalo de nuevo.');
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const resend = async () => {
    if (pending.current || remaining) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      if (!await onResend()) throw new Error('No se envió el correo.');
      if (mounted.current) { setCode(''); setRetryAt(Date.now() + 60000); }
    } catch {
      if (mounted.current) setError('No pudimos reenviar el correo. Inténtalo de nuevo.');
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return <View style={s.form}>
    <Text style={s.label}>{noWidow('Código del correo')}</Text>
    <TextInput value={code} onChangeText={(value) => { setCode(value.replace(/\D/g, '').slice(0, EMAIL_CODE_LENGTH)); setError(''); }}
      style={s.input} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code"
      maxLength={EMAIL_CODE_LENGTH} editable={!busy} accessibilityLabel={`Código de ${EMAIL_CODE_LENGTH} dígitos`} onSubmitEditing={verify} />
    {error ? <Text accessibilityRole="alert" style={s.error}>{noWidow(error)}</Text> : null}
    <TouchableOpacity onPress={verify} disabled={busy || code.length !== EMAIL_CODE_LENGTH} accessibilityRole="button"
      accessibilityState={{ disabled: busy || code.length !== EMAIL_CODE_LENGTH, busy }} style={[s.button, (busy || code.length !== EMAIL_CODE_LENGTH) && s.disabled]}>
      {busy ? <AgentSpinner variant="dots" size={18} color="#fff" /> : <Text style={s.buttonText}>Entrar</Text>}
    </TouchableOpacity>
    <TouchableOpacity onPress={resend} disabled={busy || remaining > 0} accessibilityRole="button"
      accessibilityState={{ disabled: busy || remaining > 0 }} style={s.resend}>
      <Text style={s.hint}>{noWidow(remaining ? `Reenviar en ${remaining} s` : 'Reenviar código')}</Text>
    </TouchableOpacity>
  </View>;
}
const s = StyleSheet.create({
  form: { alignSelf: 'stretch', marginTop: 16 },
  label: { fontSize: 13, color: '#fff', marginBottom: 6 },
  input: { minHeight: 52, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 16, fontSize: 22, color: '#fff', backgroundColor: 'rgba(0,0,0,0.28)' },
  button: { minHeight: 52, borderRadius: 26, marginTop: 10, backgroundColor: '#F2612F', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.5 },
  error: { color: '#FF8A8E', marginTop: 8, fontSize: 13 },
  resend: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  hint: { color: 'rgba(255,255,255,0.76)', fontSize: 13 },
});
