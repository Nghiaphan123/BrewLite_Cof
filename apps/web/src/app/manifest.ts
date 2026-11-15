import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BrewLite',
    short_name: 'BrewLite',
    description: 'Đặt và thanh toán đồ uống tại quầy.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#FAF7F2',
    theme_color: '#6F4E37',
    lang: 'vi',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
