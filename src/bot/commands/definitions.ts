export const setupData = new SlashCommandBuilder()
  .setName('setup')
  .setDescription("Configure this server's Anikoto source")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand(sub =>
    sub
      .setName('configure')
      .setDescription('Connect your Anikoto provider URL')
      .addStringOption(opt =>
        opt
          .setName('url')
          .setDescription('Base URL of your Anikoto instance (e.g. https://anikototv.to)')
          .setRequired(true),
      ),
  )
  .addSubcommand(sub =>
    sub.setName('status').setDescription('Show current configuration'),
  )
  .addSubcommand(sub =>
    sub.setName('remove').setDescription("Remove this server's configuration"),
  );
