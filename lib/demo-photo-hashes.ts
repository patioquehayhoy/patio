// Vista previa (ThumbHash, lib/photo-hash.ts) de las fotos de muestra de
// Unsplash que usan los lugares «Dev», calculada una vez (2026-11-15) con el
// mismo algoritmo de expo-image. Así en desarrollo también se ve el difuminado
// mientras baja cada foto.
const DEMO_PHOTO_HASHES: Record<string, string> = {
  '1551504734-5ee1c4a1479b': 'dae70d2d888687888f888773779969780786743068',
  '1565299585323-38d6b0865b47': 'da590a16025f78c865863ab6878c576bc6962f77b1c30b',
  '1599974579688-8dbdd335c77f': '181a0a15886688887f7a79698849766843507b85f8',
  '1613514785940-daed07799d9b': '2139062582f4a1747d5388c8671964775a60b40765',
  '1624300629298-e9de39c13be5': '66390a2d0494898f85977687798767884975c01305',
};

export function demoPhotoHash(url: string | undefined): string | undefined {
  const id = url?.match(/images\.unsplash\.com\/photo-([0-9a-z-]+)/)?.[1];
  return id ? DEMO_PHOTO_HASHES[id] : undefined;
}
