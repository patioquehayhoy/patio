// Taxonomía real: las mismas etiquetas atómicas que un Fondero puede elegir
// al darse de alta (ver BUSINESS_TYPES en app/patio-smart.tsx), modelo
// multi-tag estilo Google Places/Yelp — un lugar puede traer varias a la vez.
// Único origen de verdad — los datos demo/densidad (lib/demo.ts) deben usar
// exactamente estas etiquetas, nunca inventar otras, o los chips de categoría
// del mapa se contaminan.
export const PATIO_CATEGORIES = ['Fondita', 'Tacos', 'Antojitos', 'Elotes', 'Botanas', 'Postres', 'Café', 'Mariscos', 'Bebidas', 'Jugos y fruta', 'Restaurante'];
