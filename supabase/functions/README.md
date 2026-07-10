# Edge Functions de Patio

## `read-menu`

Saca la clave de Anthropic del cliente móvil. Para desplegarla:

```bash
supabase functions deploy read-menu
supabase secrets set ANTHROPIC_API_KEY=tu_clave
```

La app llama `supabase.functions.invoke('read-menu')`. La función requiere el
secreto `ANTHROPIC_API_KEY`; no uses una variable `EXPO_PUBLIC_*` para esta clave.
