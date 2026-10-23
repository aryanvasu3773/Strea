"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const axios_1 = __importDefault(require("axios"));
const guild_config_1 = require("../../store/guild-config");
const providers_1 = require("../../providers");
const definitions_1 = require("./definitions");
Object.defineProperty(exports, "data", { enumerable: true, get: function () { return definitions_1.setupData; } });
async function execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'status')
        return handleStatus(interaction);
    if (sub === 'remove')
        return handleRemove(interaction);
    return handleConfigure(interaction);
}
// ── /setup configure ──────────────────────────────────────────────────────────
async function handleConfigure(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const url = interaction.options.getString('url', true).replace(/\/$/, '');

    // Test the connection before saving
    await interaction.editReply('Testing connection to AnikotoTV…');
    const result = await testConnection(url);
    if (!result.ok) {
        await interaction.editReply(`Could not reach **${url}**. Please check that the URL is correct and accessible.`);
        return;
    }
    const resolvedUrl = result.resolvedUrl;

    // Save the configuration for AnikotoTV
    (0, guild_config_1.saveGuildConfig)(interaction.guildId, 'anikototv', resolvedUrl, '', null, null);
    (0, providers_1.invalidateProvider)(interaction.guildId);

    const urlNote = resolvedUrl !== url
        ? `\n-# URL was automatically updated to \`${resolvedUrl}\` (redirected from \`${url}\`)`
        : '';
    await interaction.editReply(`Connected to **AnikotoTV** at \`${resolvedUrl}\`. Members can now use \`/play\` to start streaming.${urlNote}`);
}
// ── /setup status ─────────────────────────────────────────────────────────────
async function handleStatus(interaction) {
    const cfg = (0, guild_config_1.getGuildConfig)(interaction.guildId);
    if (!cfg) {
        await interaction.reply({
            content: 'AnikotoTV is not configured. Run `/setup configure` to get started.',
            ephemeral: true,
        });
        return;
    }
    await interaction.deferReply({ ephemeral: true });

    const serverOk = await testConnection(cfg.mediaUrl);
    const embed = new discord_js_1.EmbedBuilder()
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
async function handleRemove(interaction) {
    const removed = (0, guild_config_1.deleteGuildConfig)(interaction.guildId);
    (0, providers_1.invalidateProvider)(interaction.guildId);
    await interaction.reply({
        content: removed
            ? 'AnikotoTV configuration removed.'
            : 'No configuration found for this server.',
        ephemeral: true,
    });
}
// ── Connection test ───────────────────────────────────────────────────────────
async function testConnection(url) {
    try {
        const response = await axios_1.default.get(url, {
            timeout: 8_000,
            validateStatus: () => true,
        });
        
        // Accept any successful response or redirects from the site
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
    }
    catch {
        return { ok: false, resolvedUrl: url };
    }
}
