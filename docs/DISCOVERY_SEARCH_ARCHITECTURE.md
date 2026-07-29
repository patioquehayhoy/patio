# Arquitectura de descubrimiento y búsqueda

## Vocabulario

- **Arquitectura:** qué fuentes, estados y etapas componen el sistema.
- **Algoritmo de ranking:** cómo se ordenan candidatos ya encontrados.
- **Método de producto:** reglas de interacción y feedback para que la búsqueda
  sea comprensible.
- **Casos de uso:** situaciones reales que el sistema debe resolver.

Patio necesita los cuatro; “algoritmo” por sí solo no describe la experiencia.

## Flujo

```txt
intención escrita
→ normalización semántica
→ recuperación de candidatos
→ restricciones duras
→ ranking
→ facetas opcionales
→ resultados explicables sobre el mapa
```

### 1. Intención

El foco vacío no es una búsqueda y no muestra una lista. El campo vacío conserva
el mapa como contexto. Al escribir, la búsqueda comienza mientras se teclea.

### 2. Recuperación

Buscar sobre:

- nombre y variantes del platillo;
- descripción canónica;
- sección del menú;
- giro del negocio;
- menú de hoy antes que carta permanente;
- futuros embeddings para frases como “algo tipo focaccia”.

### 3. Restricciones duras

Primero se excluye lo que no puede servir:

- sin coordenadas válidas;
- fuera del área relevante elegida;
- agotado, cuando la intención exige disponibilidad;
- filtros explícitos del usuario.

### 4. Ranking inicial

```txt
relevancia en niveles
→ distancia al centro visible del mapa
→ coincidencia exacta
→ disponibilidad de hoy
→ apertura actual
→ calidad/confianza
→ precio compatible
```

Patio ya aplica relevancia por niveles y usa la distancia al centro actual del
mapa para desempatar resultados equivalentes. La ubicación del dispositivo puede
reemplazar ese origen cuando exista consentimiento.

### 5. Filtros

No anticipar docenas de filtros. Mostrar facetas después de una consulta o cuando
la colección guardada sea suficientemente grande:

- Abierto ahora.
- Distancia.
- Precio.
- Giro: fondita, tacos, postres, bar, etc.
- Con menú hoy.

En Guardados sí tienen sentido orden y filtros de colección:

- Recientes.
- Cerca.
- Con menú hoy.
- Giro.
- Visitados/favoritos frecuentes.

## Casos de uso canónicos

- “mole”: coincidencia de platillo, cercanía en mapa.
- “bares”: filtro de giro, después distancia/apertura.
- “algo como focaccia cerca de Metro Xola”: agente semántico + restricción
  geográfica + ranking.
- “de mis guardados, qué publicó hoy”: alcance Guardados + disponibilidad.
- “barato y abierto”: restricciones precio/horario antes del ranking.

Cada nuevo caso se traduce en intención, restricciones, ranking y explicación;
no en una pantalla especial independiente.
