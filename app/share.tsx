import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { HintSheet } from '@/components/hint-sheet';
import { markHintSeen, shouldShowHint } from '@/lib/hints';
import { useTheme } from '@/lib/theme';
import {
  getFonditaName,
  getMenuData,
  type MenuData,
} from '@/lib/menu-store';

export default function ShareScreen() {
  const { theme } = useTheme();
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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 15, color: theme.textSecondary, textAlign: 'center' }}>
          No hay menú guardado aún.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.fonditaName, { color: theme.text, fontWeight: '900' }]}>
          {fonditaName}
        </Text>
        <Text style={[styles.menuTitle, { color: theme.textSecondary }]}>
          Menú del día
        </Text>

        {data.secciones.filter(sec => sec.platillos.some(p => p.nombre)).map(sec => (
          <View key={sec.id} style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.text }]}>{sec.nombre}</Text>
            {sec.platillos.filter(p => p.nombre).map((plat, i) => (
              <Text key={plat.id ?? i} style={[styles.item, { color: theme.text }]}>
                {'• ' + plat.nombre + (plat.descripcion ? ' / ' + plat.descripcion : '') + (plat.precio ? ' ($' + plat.precio + ')' : '')}
              </Text>
            ))}
            {!!sec.precio?.trim() && (
              <Text style={[styles.precio, { color: theme.text }]}>${sec.precio}</Text>
            )}
          </View>
        ))}

        <Text style={[styles.menuDeHoy, { color: theme.textSecondary }]}>Menú de hoy</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 16,
  },
  fonditaName: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 4,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: 24,
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
    fontWeight: '300',
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
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    fontWeight: '300',
  },
});
