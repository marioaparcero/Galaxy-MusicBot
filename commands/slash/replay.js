const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("replay")
	.setNameLocalizations({
		'es-ES': 'reproducir',
	})
	.setDescription("Replay current playing track")
	.setDescriptionLocalizations({
		'es-ES': 'Reproducir la pista en reproducción actual',
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
						//.setDescription("I'm not playing anything."),
						.setDescription("No estoy reproduciendo nada."),
				],
				flags: 64,
			});
		}
		
		await interaction.deferReply();
		
		player.seek(0);
		
		let song = player.queue.current;
		return interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					//.setDescription(`Replay [${ song.title }](${ song.uri })`),
					.setDescription(`Repetición [${ song.title }](${ song.uri })`),
			],
		});
	});

module.exports = command;
