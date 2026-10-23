import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure Strea for AnikotoTV')
    .addStringOption(option =>
        option
            .setName('url')
            .setDescription('Enter your AnikotoTV URL (e.g., https://anikototv.to)')
            .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const targetUrl = interaction.options.getString('url', true);

    // TODO: Save targetUrl to your configuration file or database storage here

    await interaction.reply({
        content: `Successfully configured Strea with AnikotoTV URL: **${targetUrl}**`,
        ephemeral: true
    });
}
