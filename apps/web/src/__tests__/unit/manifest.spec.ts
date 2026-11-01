import { describe, expect, it } from 'vitest';
import manifest from '@/app/manifest';

describe('PWA manifest', () => {
  it('has the fields a browser needs to offer installation', () => {
    const data = manifest();

    expect(data.name).toBe('BrewLite');
    expect(data.start_url).toBe('/');
    expect(data.display).toBe('standalone');
    expect(data.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/icons/icon-192.png', sizes: '192x192' }),
        expect.objectContaining({ src: '/icons/icon-512.png', sizes: '512x512' }),
      ]),
    );
  });
});
