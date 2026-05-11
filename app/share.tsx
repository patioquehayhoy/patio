import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { HintSheet } from '@/components/hint-sheet';
import { markHintSeen, shouldShowHint } from '@/lib/hints';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  getFonditaName,
  getMenuData,
  type MenuData,
} from '@/lib/menu-store';

export default function ShareScreen() {
  const [data, setData] = useState<MenuData | null>(null);
  const [showShareHint, setShowShareHint] = useState(false);
  const fonditaName = getFonditaName();

  useFocusEffect(
    useCallback(() => {
      setData(getMenuData());
      let mounted = true;
      shouldShowHint('fondero_share').then((show) => { if (mounted && show) setShowShareHint(true); });
      return () => { mounted = false; };
    }, [])
  );

  if (!data) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.empty}>No hay menú guardado aún.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ThemedText type="title" style={styles.fonditaName}>
          {fonditaName}
        </ThemedText>
        <ThemedText type="defaultSemiBold" style={styles.menuTitle}>
          Menú del día
        </ThemedText>

        {data.secciones.filter(s => s.platillos.some(p => p.nombre)).map(sec => (
          <View key={sec.id} style={styles.section}>
            <ThemedText style={styles.sectionLabel}>{sec.nombre}</ThemedText>
            {sec.platillos.filter(p => p.nombre).map((plat, i) => (
              <ThemedText key={plat.id ?? i} style={styles.item}>
                {'• ' + plat.nombre + (plat.descripcion ? ' / ' + plat.descripcion : '') + (plat.precio ? ' ($' + plat.precio + ')' : '')}
              </ThemedText>
            ))}
            {!!sec.precio?.trim() && (
              <ThemedText style={styles.precio}>${sec.precio}</ThemedText>
            )}
          </View>
        ))}

        <ThemedText style={styles.menuDeHoy}>Menú de hoy</ThemedText>
      </ScrollView>
      <HintSheet
        visible={showShareHint}
        icon="✉️"
        title="Ya está, compártelo"
        body="Mándalo por WhatsApp o donde quieras. Patio ya formateó todo por ti."
        primaryLabel="Entendido"
        onPrimary={() => { markHintSeen('fondero_share'); setShowShareHint(false); }}
        onDismiss={() => { markHintSeen('fondero_share'); setShowShareHint(false); }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 16,
  },
  fonditaName: {
    textAlign: 'center',
    marginBottom: 4,
  },
  menuTitle: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 24,
    opacity: 0.7,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  item: {
    fontSize: 15,
    marginLeft: 8,
    marginBottom: 2,
  },
  precio: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
  },
  menuDeHoy: {
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.5,
    marginTop: 16,
    fontSize: 14,
  },
  empty: {
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: 24,
  },
});
