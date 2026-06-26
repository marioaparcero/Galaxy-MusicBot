const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("pause")
	.setNameLocalizations({
		'es-ES': 'pausar',
	})
	.setDescription("Pauses the current playing track")
	.setDescriptionLocalizations({
		'es-ES': 'Pausa la pista en reproducción actual',
  	})
	.setRun(async (client, interaction, options) => {
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
						.setDescription("No hay nada reproduciéndose."),
				],
				flags: 64,
			});
		}
		
		if (player.paused) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(0xff0000)
						.setDescription("¡La pista de reproducción actual ya está en pausa!"),
				],
				flags: 64,
			});
		}
		
		player.pause(true);
		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(`⏸ | **¡Pausada!**`),
			],
		});
	});

module.exports = command;
