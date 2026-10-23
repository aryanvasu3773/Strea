import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { getGuildConfig, saveGuildConfig, deleteGuildConfig } from '../../store/guild-config';
import { invalidateProvider } from '../../providers';
import { setupData } from './definitions';

export { setupData as data };

export async function execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'status') return handleStatus(interaction);
    if (sub === 'remove') return handleRemove(interaction);
    return handleConfigure(interaction);
}

// ── /setup configure ──────────────────────────────────────────────────────────
async function handleConfigure(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const url = interaction.options.getString('url', true).replace(/\/$/, '');

    // Test connection to AnikotoTV before saving
    await interaction.editReply('Testing connection to AnikotoTV…');
    const result = await testConnection(url);
    if (!result.ok) {
        await interaction.editReply(`Could not reach **${url}**. Please check that the URL is correct and accessible.`);
        return;
    }
    const resolvedUrl = result.resolvedUrl;

    // Save configuration for AnikotoTV
    saveGuildConfig(interaction.guildId, 'anikototv', resolvedUrl, '', null, null);
    invalidateProvider(interaction.guildId);

    const urlNote = resolvedUrl !== url
        ? `\n-# URL was automatically updated to \`${resolvedUrl}\` (redirected from \`${url}\`)`
        : '';
    await interaction.editReply(`Connected to **AnikotoTV** at \`${resolvedUrl}\`. Members can now use \`/play\` to start streaming.${urlNote}`);
}

// ── /setup status ─────────────────────────────────────────────────────────────
async function handleStatus(interaction: ChatInputCommandInteraction) {
    const cfg = getGuildConfig(interaction.guildId);
    if (!cfg) {
        await interaction.reply({
            content: 'AnikotoTV is not configured. Run `/setup configure` to get started.',
            ephemeral: true,
        });
        return;
    }
    await interaction.deferReply({ ephemeral: true });

    const serverOk = await testConnection(cfg.mediaUrl);
    const embed = new EmbedBuilder()
        .setTitle('AnikotoTV Configuration')
        .addFields(
            { name: 'Provider', value: 'AnikotoTV', inline: true },
            { name: 'URL', value: cfg.mediaUrl, inline: true },
            { name: 'Configured', value: `<t:${Math.floor(cfg.configuredAt / 1000)}:R>`, inline: true },
            { name: 'Status', value: serverOk.ok ? '✅ Connected and reachable' : '❌ Unreachable', inline: false }
        )
        .setColor(serverOk.ok ? 0x57f287 : 0xed4245);
    await interaction.editReply({ embeds: [embed] });
}

// ── /setup remove ─────────────────────────────────────────────────────────────
async function handleRemove(interaction: ChatInputCommandInteraction) {
    const removed = deleteGuildConfig(interaction.guildId);
    invalidateProvider(interaction.guildId);
    await interaction.reply({
        content: removed
            ? 'AnikotoTV configuration removed.'
            : 'No configuration found for this server.',
        ephemeral: true,
    });
}

// ── Connection test ───────────────────────────────────────────────────────────
async function testConnection(url: string): Promise<{ ok: boolean; resolvedUrl: string }> {
    try {
        const response = await axios.get(url, {
            timeout: 8_000,
            validateStatus: () => true,
        });

        if (response.status < 200 || response.status >= 400) {
            return { ok: false, resolvedUrl: url };
        }

        const finalUrl = response.request?.res?.responseUrl;
        let resolvedUrl = url;
        if (finalUrl) {
            const parsed = new URL(finalUrl);
            resolvedUrl = `${parsed.protocol}//${parsed.host}`;
        }
        return { ok: true, resolvedUrl };
    } catch {
        return { ok: false, resolvedUrl: url };
    }
}
