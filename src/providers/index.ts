import type { MediaProvider } from './types';
import { getGuildConfig } from '../store/guild-config';
import { AnikotoTvProvider } from './anikototv';

export type { MediaItem, MediaProvider } from './types';

// Provider instances are cached per guild
const cache = new Map<string, MediaProvider>();

export function getProvider(guildId: string): MediaProvider {
  if (cache.has(guildId)) return cache.get(guildId)!;

  const cfg = getGuildConfig(guildId);
  if (!cfg) throw new Error(`Guild ${guildId} has no media server configured`);

  // Sole provider: Anikoto
  const provider = new AnikotoTvProvider(cfg.mediaUrl);

  cache.set(guildId, provider);
  return provider;
}

/** Returns null instead of throwing — use in commands to show a friendly error. */
export function getProviderForGuild(guildId: string): MediaProvider | null {
  try {
    return getProvider(guildId);
  } catch {
    return null;
  }
}

/** Call after saving new guild config so the stale instance isn't reused. */
export function invalidateProvider(guildId: string): void {
  cache.delete(guildId);
}
