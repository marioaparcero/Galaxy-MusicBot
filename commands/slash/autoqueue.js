const colors = require("colors");
const { EmbedBuilder } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand()
	.setName("autoqueue")
	.setNameLocalizations({
		'es-ES': 'autocola',
	})
	.setDescription("Automatically add songs to the queue (toggle)")
	.setDescriptionLocalizations({
		'es-ES': 'Agregar canciones automáticamente a la cola (alternar)',
  	})
	.setRun(async (client, interaction) => {
		let channel = await client.getChannel(client, interaction);
		if (!channel) {
			return;
		}
		
		let player;
		if (client.manager) {
			player = client.manager.players.get(interaction.guild.id);
		} else {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(0xff0000)
						.setDescription("El servidor de música no está conectado"),
				],
			});
		}
		
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
		
		let autoQueueEmbed = new EmbedBuilder().setColor(client.config.embedColor);
		const autoQueue = player.get("autoQueue");
		player.set("requester", interaction.guild.members.me);
		
		if (!autoQueue || autoQueue === false) {
			player.set("autoQueue", true);
		} else {
			player.set("autoQueue", false);
		}
		autoQueueEmbed
		  .setDescription(`**La cola automática está** \`${!autoQueue ? "Encendida" : "Apagada"}\``)
		  .setFooter({
		    text: `La música relacionada ${!autoQueue ? "ahora" : "ya no"} se agregará automáticamente a la cola.`
      });
		client.warn(
			`Reproductor: ${ player.options.guildId } | [${ colors.blue(
				"AUTOQUEUE",
			) }] ha sido [${ colors.blue(!autoQueue? "ENABLED" : "DISABLED") }] in ${
				client.guilds.cache.get(player.options.guildId)
					? client.guilds.cache.get(player.options.guildId).name
					: "un servidor"
			}`,
		);
		
		return interaction.reply({ embeds: [autoQueueEmbed] });
	});

module.exports = command;
