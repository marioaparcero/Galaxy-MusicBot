const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("resume")
	.setNameLocalizations({
		'es-ES': 'reanudar',
	})
	.setDescription("Resume current track")
	.setDescriptionLocalizations({
		'es-ES': 'Reanudar la pista actual',
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
						//.setDescription("There is no song playing right now."),
						.setDescription("No hay ninguna canción sonando en este momento."),
				],
				flags: 64,
			});
		}
		
		if (!player.paused) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(0xff0000)
						//.setDescription("Current track is already resumed"),
						.setDescription("La pista actual ya se ha reanudado."),
				],
				flags: 64,
			});
		}
		player.pause(false);
		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					//.setDescription(`⏯ **Resumed!**`),
					.setDescription(`⏯ **¡Reanudado!**`),
			],
		});
	});

module.exports = command;
