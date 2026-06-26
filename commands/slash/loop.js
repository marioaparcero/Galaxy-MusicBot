const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("loop")
	.setNameLocalizations({
		'es-ES': 'repetir',
	})
	.setDescription("Loops the current song")
	.setDescriptionLocalizations({
		'es-ES': 'Repetir la canción actual',
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
						.setDescription("No se reproduce nada en este momento."),
				],
				flags: 64,
			});
		}
		
		if (player.setTrackRepeat(!player.trackRepeat)) {
			;
		}
		const trackRepeat = player.trackRepeat? "enabled" : "disabled";
		
		interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(`👍 | **El bucle ha sido \`${ trackRepeat }\`**`),
			],
		});
	});

module.exports = command;
