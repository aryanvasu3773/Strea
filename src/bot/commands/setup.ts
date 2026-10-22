import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { getGuildConfig, saveGuildConfig, deleteGuildConfig } from '../../store/guild-config';
import { invalidateProvider } from '../../providers';
import { setupData as data } from './definitions';

export { data };

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sub = interaction.options.getSubcommand();

  if (sub === 'status') return handleStatus(interaction);
  if (sub === 'remove') return handleRemove(interaction);
  return handleConfigure(interaction);
}

// ── /setup configure ──────────────────────────────────────────────────────────

async function handleConfigure(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const url = interaction.options.getString('url', true).replace(/\/$/, '');

  // Test connection to the Anikoto provider base URL
  await interaction.editReply('Testing connection to your Anikoto source…');
  const ok = await testConnection(url);
  
  if (!ok) {
    await interaction.editReply(
      `Could not reach **${url}**.\n` +
      `- Check that the URL is correct and accessible from this server\n`,
    );
    return;
  }

  // Save config with 'anikoto' provider type
  saveGuildConfig(interaction.guildId!, 'anikoto', url, '');
  invalidateProvider(interaction.guildId!);

  await interaction.editReply(
    `Connected to **Anikoto** at \`${url}\`. Members can now use \`/play\` to start a watch party.`,
  );
}

// ── /setup status ─────────────────────────────────────────────────────────────

async function handleStatus(interaction: ChatInputCommandInteraction): Promise<void> {
  const cfg = getGuildConfig(interaction.guildId!);

  if (!cfg) {
    await interaction.reply({
      content: 'No Anikoto source configured. Run `/setup configure` to get started.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const online = await testConnection(cfg.mediaUrl);
  const embed = new EmbedBuilder()
    .setTitle('Anikoto Configuration')
    .addFields(
      { name: 'Provider', value: 'Anikoto', inline: true },
      { name: 'URL', value: cfg.mediaUrl, inline: true },
      { name: 'Configured', value: `<t:${Math.floor(cfg.configuredAt / 1000)}:R>`, inline: true },
      { name: 'Status', value: online ? '✅ Online & Reachable' : '❌ Unreachable', inline: false },
    )
    .setColor(online ? 0x57f287 : 0xed4245);

  await interaction.editReply({ embeds: [embed] });
}

// ── /setup remove ─────────────────────────────────────────────────────────────

async function handleRemove(interaction: ChatInputCommandInteraction): Promise<void> {
  const removed = deleteGuildConfig(interaction.guildId!);
  invalidateProvider(interaction.guildId!);

  await interaction.reply({
    content: removed
      ? 'Anikoto configuration removed.'
      : 'No configuration found for this server.',
    ephemeral: true,
  });
}

// ── Connection test ───────────────────────────────────────────────────────────

async function testConnection(url: string): Promise<boolean> {
  try {
    await axios.get(url, { timeout: 8_000 });
    return true;
  } catch {
    return false;
  }
}
