const SlashCommand = require("../../lib/SlashCommand");
const { MessageEmbed } = require("discord.js");

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
					new MessageEmbed()
						.setColor("RED")
						.setDescription("El nodo Lavalink no está conectado"),
				],
			});
		}
		
		if (!player) {
			return interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor("RED")
						//.setDescription("There is no song playing right now."),
						.setDescription("No hay ninguna canción sonando en este momento."),
				],
				ephemeral: true,
			});
		}
		
		if (!player.paused) {
			return interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor("RED")
						//.setDescription("Current track is already resumed"),
						.setDescription("La pista actual ya se ha reanudado."),
				],
				ephemeral: true,
			});
		}
		player.pause(false);
		return interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor(client.config.embedColor)
					//.setDescription(`⏯ **Resumed!**`),
					.setDescription(`⏯ **¡Reanudado!**`),
			],
		});
	});

module.exports = command;
