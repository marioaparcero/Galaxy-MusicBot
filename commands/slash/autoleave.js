const colors = require("colors");
const { EmbedBuilder } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand()
  .setName("autoleave")
  .setNameLocalizations({
		'es-ES': 'autosalir',
	})
  .setDescription("Automatically leaves when everyone leaves the voice channel (toggle)")
  .setDescriptionLocalizations({
		'es-ES': 'Se sale automáticamente cuando todos abandonan el canal de voz (alternar)',
  })
  .setRun(async (client, interaction) => {
    let channel = await client.getChannel(client, interaction);
    if (!channel) return;

    let player;
    if (client.manager)
      player = client.manager.players.get(interaction.guild.id);
    else
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setDescription("El servidor de música no está conectado"),
        ],
      });

    if (!player) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setDescription("No hay nada reproduciéndose en la cola"),
        ],
        flags: 64,
      });
    }

    let autoLeaveEmbed = new EmbedBuilder().setColor(client.config.embedColor);
    const autoLeave = player.get("autoLeave");
    player.set("requester", interaction.guild.me);

    if (!autoLeave || autoLeave === false) {
      player.set("autoLeave", true);
    } else {
      player.set("autoLeave", false);
    }
    autoLeaveEmbed
			.setDescription(`**La salida automática es** \`${!autoLeave ? "ON" : "OFF"}\``)
			.setFooter({
			  text: `El reproductor ${!autoLeave ? "saldrá" : "no saldrá"} automáticamente cuando el canal de voz esté vacío.`
			});
    client.warn(
      `Reproductor: ${player.options.guildId} | [${colors.blue(
        "autoLeave"
      )}] ha sido [${colors.blue(!autoLeave ? "ENABLED" : "DISABLED")}] in ${
        client.guilds.cache.get(player.options.guildId)
          ? client.guilds.cache.get(player.options.guildId).name
          : "un servidor"
      }`
    );

    return interaction.reply({ embeds: [autoLeaveEmbed] });
  });

module.exports = command;