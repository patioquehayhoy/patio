// Muted monochrome style for Google Maps provider (Android + iOS PROVIDER_GOOGLE)
// On iOS with default Apple provider, mapType="mutedStandard" handles the muted look
export const MAP_STYLE_LIGHT = [
  { elementType: 'geometry', stylers: [{ color: '#e9e8e0' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8c8c84' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f4f3ee' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#dde0d4' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f0efea' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#aaa99a' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#c0bfb8' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c8cfd8' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
];

export const MAP_STYLE_DARK = [
  { elementType: 'geometry', stylers: [{ color: '#191a1b' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#505048' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111112' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#232424' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#262626' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2e2e2e' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e10' }] },
];
