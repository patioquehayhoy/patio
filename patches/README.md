# Parches de compatibilidad

`query-string+7.1.3.patch` adapta la importación CJS al export default de
`decode-uri-component` 0.5.0. El override en package.json instala la versión
corregida oficial, en lugar de conservar el decodificador vulnerable 0.2.2.
`query-string` ya convierte `+` a espacio antes de decodificar.

El parche se reaplica con el postinstall existente de patch-package.
Verificaciones: enlaces con espacios/acentos, campos repetidos, credenciales
callback, entrada malformada grande con tiempo acotado y exportaciones Metro
iOS/Android. La app/CI usa Node compatible con require(ESM) (Node 22 actual;
Expo 54 exige Node >=20.19).

Aviso corregido: https://github.com/advisories/GHSA-vcc3-ghjq-m6fr
Las alertas de node-forge son independientes; este parche no las oculta.
