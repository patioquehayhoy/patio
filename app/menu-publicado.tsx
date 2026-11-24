import { Redirect, useLocalSearchParams } from 'expo-router';

// Ruta antigua: al publicar ya no se abre una pantalla aparte; el aviso de
// «Publicado» vive arriba de Menús (Parco, 24 nov). Se conserva para enlaces viejos.
export default function MenuPublicadoScreen() {
  const { actualizado, programado } = useLocalSearchParams<{ actualizado?: string; programado?: string }>();
  const publicado = programado ? 'programado' : actualizado === '1' ? 'actualizado' : 'hoy';
  return <Redirect href={{ pathname: '/historial', params: { publicado, ...(programado ? { at: programado } : {}) } }} />;
}
