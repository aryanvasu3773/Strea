import axios from 'axios';
import { MediaItem, MediaProvider } from './types';

export class AnikotoProvider implements MediaProvider {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async search(query: string, limit = 10): Promise<MediaItem[]> {
    try {
      // Example endpoint structure mapping to an anime source/API
      const res = await axios.get(`${this.baseUrl}/api/search`, {
        params: { q: query },
        timeout: 8000,
      });

      const results = res.data?.data?.results || res.data?.results || [];
      return results.slice(0, limit).map((item: any) => ({
        id: item.slug || item.id,
        title: item.title,
        type: 'episode',
        duration: 24 * 60 * 1000, // default estimate or fetched value
        summary: item.synopsis,
        partKey: item.episodeUrl || item.url,
      }));
    } catch (err) {
      console.error('Anikoto search error:', err);
      return [];
    }
  }

  async getMetadata(id: string): Promise<MediaItem | null> {
    try {
      const res = await axios.get(`${this.baseUrl}/api/anime/${id}`, {
        timeout: 8000,
      });
      const data = res.data?.data;
      if (!data) return null;

      return {
        id: data.slug || id,
        title: data.title,
        type: 'show',
        duration: 24 * 60 * 1000,
        summary: data.synopsis,
      };
    } catch {
      return null;
    }
  }

  async fetchPlaylist(id: string, proxyBase: string): Promise<{ content: string; protocol: 'hls' | 'dash' }> {
    // If your source provides direct HLS (.m3u8) links or custom manifests, 
    // construct or proxy the playlist content here.
    return {
      content: `#EXTM3U\n#EXT-X-VERSION:3\n#EXTINF:1440,\n${this.resolveStreamUrl(id)}`,
      protocol: 'hls',
    };
  }

  resolveStreamUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return `${this.baseUrl}/${path.replace(/^\//, '')}`;
  }

  getThumbUrl(id: string | undefined): string | null {
    return null;
  }
}
