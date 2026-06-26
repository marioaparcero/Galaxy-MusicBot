const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand()
  .setName("invite")
  .setNameLocalizations({
		'es-ES': 'invitar',
	})
  .setDescription("Invite me to your server")
  .setDescriptionLocalizations({
		'es-ES': 'Invitame a tu servidor',
  })
  .setRun(async (client, interaction, options) => {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setTitle(`Invitame a tu servidor!`),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("Invitame")
            .setStyle(5)
            .setURL(
              `https://discord.com/oauth2/authorize?client_id=${
                client.config.clientId
              }&permissions=${
                client.config.permissions
              }&scope=${client.config.inviteScopes
                .toString()
                .replace(/,/g, "%20")}`
            )
        ),
      ],
    });
  });
module.exports = command;
