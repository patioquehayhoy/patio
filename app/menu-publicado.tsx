import { useLocalSearchParams } from 'expo-router';

import { MenuPoster } from './preview';

// Después de publicar: el póster del menú con la confirmación arriba, en un
// solo paso. «Editar» vive junto al menú que se está viendo. Si se cambió el
// menú que ya estaba publicado hoy, dice «Actualizado».
export default function MenuPublicadoScreen() {
  const { actualizado } = useLocalSearchParams<{ actualizado?: string }>();
  return <MenuPoster justPublished updated={actualizado === '1'} />;
}
