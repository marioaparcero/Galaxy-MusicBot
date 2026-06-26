const colors = require("colors");
const { EmbedBuilder } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand()
  .setName("autopause")
  .setNameLocalizations({
		'es-ES': 'autopausar',
	})
  .setDescription("Automatically pause when everyone leaves the voice channel (toggle)")
  .setDescriptionLocalizations({
		'es-ES': 'Pausa automáticamente cuando todos abandonan el canal de voz (alternar)',
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

    let autoPauseEmbed = new EmbedBuilder().setColor(client.config.embedColor);
    const autoPause = player.get("autoPause");
    player.set("requester", interaction.guild.members.me);

    if (!autoPause || autoPause === false) {
      player.set("autoPause", true);
    } else {
      player.set("autoPause", false);
    }
    autoPauseEmbed
			.setDescription(`**La pausa automatica está** \`${!autoPause ? "Encendida" : "Apagada"}\``)
			.setFooter({
			  text: `The player will ${!autoPause ? "now be automatically" : "no longer be"} paused when everyone leaves the voice channel.`
			});
    client.warn(
      `Reproductor: ${player.options.guildId} | [${colors.blue(
        "AUTOPAUSE"
      )}] has been [${colors.blue(!autoPause ? "ENABLED" : "DISABLED")}] in ${
        client.guilds.cache.get(player.options.guildId)
          ? client.guilds.cache.get(player.options.guildId).name
          : "un servidor"
      }`
    );

    return interaction.reply({ embeds: [autoPauseEmbed] });
  });

module.exports = command;
