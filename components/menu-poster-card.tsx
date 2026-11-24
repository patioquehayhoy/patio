import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { isCartaName } from '@/lib/menu-carta';
import type { PosterData } from '@/lib/poster-data';
import { Type } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// El póster del menú: lo mismo en la vista previa del editor (antes de
// publicar) y en la imagen para compartir. Siempre claro, como el pizarrón.
export const LIGHT = { bg: '#F8F8F5', card: '#FFFFFF', ink: '#111214', inkSoft: '#4A4A47', mute: '#8A8A85', sep: 'rgba(17,18,20,0.06)', accent: '#F2612F' };

export { posterFromMenu, type PosterData } from '@/lib/poster-data';

export const PosterCard = forwardRef<View, PosterData & { fecha: string; businessName: string }>(function PosterCard(
  { fecha, businessName, priceLabel, priceName, menuPrices, sections, carta },
  ref,
) {
  return (
    <View ref={ref} collapsable={false} style={s.poster}>
      {/* Header editorial: identidad primero. El precio único es un dato
          secundario y nunca compite con el nombre o los platillos. */}
      <View style={s.posterHead}>
        <View style={s.posterHeadLeft}>
          <Text style={s.posterDate} allowFontScaling={true}>{fecha}</Text>
          <Text style={s.posterName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6} allowFontScaling={true}>{businessName}</Text>
        </View>
        {/* Precio del menú completo (comida corrida): a la derecha, como
            en la pizarra de la fonda — visible, un paso abajo del nombre. */}
        {!!priceLabel && (
          <View style={s.posterPrice} accessible accessibilityLabel={`${priceName}, ${priceLabel}`}>
            <Text style={s.posterPriceLabel} allowFontScaling={true}>{priceName.toLocaleUpperCase('es-MX')}</Text>
            <Text style={s.posterPriceValue} allowFontScaling={true}>{priceLabel}</Text>
          </View>
        )}
      </View>

      {/* Card de menú: las secciones hablan solas, sin label redundante. */}
      <View style={s.menuCard}>
        {/* Con varios precios del menú, la lista completa va primero; el
            de arriba a la derecha es el principal. */}
        {menuPrices.length > 1 && (
          <View>
            <Text style={s.menuSectionTitle}>PRECIOS</Text>
            {menuPrices.map((item, index) => (
              <View key={`${index}-${item.label}`} style={s.menuRow}>
                <Text style={[s.menuRowName, { flex: 1 }]} allowFontScaling={true}>{noWidow(item.label || 'Menú')}</Text>
                <Text style={s.menuRowPrice} allowFontScaling={true}>{item.price}</Text>
              </View>
            ))}
          </View>
        )}
        {sections.map((section, sectionIndex) => (
          <View key={section.id} style={(sectionIndex > 0 || menuPrices.length > 1) && s.menuSection}>
            <View style={s.menuSectionHead}>
              <Text style={[s.menuSectionTitle, { flex: 1 }]}>{section.nombre}</Text>
              {!!section.precio.trim() && <Text style={s.menuSectionTitle}>${section.precio.trim()}</Text>}
            </View>
            {section.platillos.map((dish) => (
              <View key={dish.id} style={s.menuRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.menuRowName, dish.agotado && s.unavailableName]} allowFontScaling={true}>{dish.nombre}</Text>
                  {dish.descripcion ? <Text style={s.menuRowDescription}>{noWidow(dish.descripcion)}</Text> : null}
                </View>
                {dish.agotado ? <Text style={s.unavailableLabel}>{noWidow('Se acabó')}</Text> : dish.precio ? <Text style={s.menuRowPrice} allowFontScaling={true}>${dish.precio}</Text> : null}
              </View>
            ))}
          </View>
        ))}
        {/* La carta, debajo de lo de hoy, como en el pizarrón: «CARTA
            $110» en su encabezado; solo las excepciones llevan precio. */}
        {carta.map((section, sectionIndex) => {
          const first = sectionIndex === 0;
          const merged = first && isCartaName(section.nombre);
          const price = section.precio.trim() ? `$${section.precio.trim()}` : '';
          return (
            <View key={`carta-${section.id}`} style={[s.menuSection, first && s.cartaStart]}>
              {first && (
                <View style={s.menuSectionHead}>
                  <Text style={[s.menuSectionTitle, { flex: 1 }]}>LA CARTA</Text>
                  {merged && !!price && <Text style={s.menuSectionTitle}>{price}</Text>}
                </View>
              )}
              {!merged && (
                <View style={s.menuSectionHead}>
                  <Text style={[s.menuSectionTitle, { flex: 1 }]}>{section.nombre}</Text>
                  {!!price && <Text style={s.menuSectionTitle}>{price}</Text>}
                </View>
              )}
              {section.platillos.map((dish) => (
                <View key={dish.id} style={s.menuRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.menuRowName} allowFontScaling={true}>{dish.nombre}</Text>
                    {dish.descripcion ? <Text style={s.menuRowDescription}>{noWidow(dish.descripcion)}</Text> : null}
                  </View>
                  {dish.precio ? <Text style={s.menuRowPrice} allowFontScaling={true}>${dish.precio}</Text> : null}
                </View>
              ))}
            </View>
          );
        })}
      </View>

      {/* Firma de marca: minimalista — una línea sutil en light, nada más. */}
      <View style={s.posterFoot}>
        <View style={s.footRule} />
        <Text style={s.posterSign} allowFontScaling={true}>{noWidow('¿Qué hay hoy? Saaaaaaabes.')}</Text>
      </View>
    </View>
  );
});

const s = StyleSheet.create({
  poster: { width: 330, borderRadius: 26, borderCurve: 'continuous', backgroundColor: LIGHT.bg, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.24, shadowRadius: 34, elevation: 12 },
  posterHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 18 },
  posterHeadLeft: { flex: 1 },
  posterPrice: { alignItems: 'flex-end' },
  menuSectionHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  posterPriceLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: LIGHT.inkSoft, marginBottom: 7 },
  posterPriceValue: { ...Type.section, color: LIGHT.ink, fontVariant: ['tabular-nums'] },
  posterDate: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: LIGHT.accent, marginBottom: 7 },
  posterName: { ...Type.screen, color: LIGHT.ink },

  // Densidad editorial (regla HIG): nombre+descripción son una unidad óptica
  // (1px de separación), filas a 5px, secciones a 10px — el aire vive ENTRE
  // grupos, nunca dentro de ellos.
  menuCard: { marginHorizontal: 18, padding: 18, borderRadius: 18, borderCurve: 'continuous', backgroundColor: LIGHT.card, borderWidth: StyleSheet.hairlineWidth, borderColor: LIGHT.sep },
  menuSection: { marginTop: 10 },
  // La carta se separa de lo de hoy con una línea, como en la ficha.
  cartaStart: { marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: LIGHT.sep },
  menuSectionTitle: { marginBottom: 2, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: LIGHT.accent, textTransform: 'uppercase', lineHeight: 14 },
  menuRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 5, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: LIGHT.sep },
  menuRowName: { fontSize: 14, lineHeight: 18, fontWeight: '500', color: LIGHT.ink, marginRight: 10 },
  menuRowDescription: { marginTop: 1, fontSize: 12, lineHeight: 16, color: LIGHT.inkSoft },
  menuRowPrice: { fontSize: 13, fontWeight: '400', color: LIGHT.inkSoft },
  unavailableName: { color: LIGHT.inkSoft, textDecorationLine: 'line-through' },
  unavailableLabel: { fontSize: 13, lineHeight: 18, fontWeight: '500', color: LIGHT.inkSoft },

  posterFoot: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 18 },
  footRule: { height: StyleSheet.hairlineWidth, backgroundColor: LIGHT.sep, marginBottom: 12 },
  posterSign: { textAlign: 'center', fontSize: 11, fontWeight: '400', letterSpacing: 0.4, color: LIGHT.mute },

});
