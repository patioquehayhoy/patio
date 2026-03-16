import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  getFonditaName,
  getMenuData,
  getTiempoLabels,
  type MenuData,
} from '@/lib/menu-store';

export default function ShareScreen() {
  const [data, setData] = useState<MenuData | null>(null);
  const fonditaName = getFonditaName();

  useFocusEffect(
    useCallback(() => {
      setData(getMenuData());
    }, [])
  );

  if (!data) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.empty}>No hay menú guardado aún.</ThemedText>
      </ThemedView>
    );
  }

  const { primerLabel, segundoLabel, tercerLabel } = getTiempoLabels(data);

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

        {data.primerTiempo.enabled && data.primerTiempo.items.some(Boolean) && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>{primerLabel}</ThemedText>
            {data.primerTiempo.items.filter(Boolean).map((item, i) => (
              <ThemedText key={i} style={styles.item}>
                • {item}
              </ThemedText>
            ))}
          </View>
        )}

        {data.segundoTiempo.enabled && data.segundoTiempo.items.some(Boolean) && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>{segundoLabel}</ThemedText>
            {data.segundoTiempo.items.filter(Boolean).map((item, i) => (
              <ThemedText key={i} style={styles.item}>
                • {item}
              </ThemedText>
            ))}
          </View>
        )}

        {data.tercerTiempoGuisado.enabled && data.tercerTiempoGuisado.items.some(Boolean) && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>{tercerLabel}</ThemedText>
            {data.tercerTiempoGuisado.items.filter(Boolean).map((item, i) => (
              <ThemedText key={i} style={styles.item}>
                • {item}
              </ThemedText>
            ))}
          </View>
        )}

        {data.postre.enabled && data.postre.items.some(Boolean) && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>Postre</ThemedText>
            {data.postre.items.filter(Boolean).map((item, i) => (
              <ThemedText key={i} style={styles.item}>
                • {item}
              </ThemedText>
            ))}
          </View>
        )}

        {data.aguas.enabled && data.aguas.items.some(Boolean) && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>Aguas</ThemedText>
            {data.aguas.items.filter(Boolean).map((item, i) => (
              <ThemedText key={i} style={styles.item}>
                • {item}
              </ThemedText>
            ))}
          </View>
        )}

        {data.precio.enabled && data.precio.value.trim() && (
          <View style={styles.section}>
            <ThemedText style={styles.precio}>${data.precio.value}</ThemedText>
          </View>
        )}

        <ThemedText style={styles.menuDeHoy}>Menú de hoy</ThemedText>
      </ScrollView>

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
    fontWeight: '600',
    marginBottom: 4,
  },
  item: {
    fontSize: 15,
    marginLeft: 8,
    marginBottom: 2,
  },
  precio: {
    fontSize: 20,
    fontWeight: '700',
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
