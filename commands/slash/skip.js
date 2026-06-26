const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("skip")
	.setNameLocalizations({
		'es-ES': 'siguiente',
	})
	.setDescription("Skip the current song")
	.setDescriptionLocalizations({
		'es-ES': 'Saltar la canción actual',
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
						.setDescription("No hay nada para saltar."),
				],
				flags: 64,
			});
		} 
        	const song = player.queue.current;
	        const autoQueue = player.get("autoQueue");
                if (player.queue[0] == undefined && (!autoQueue || autoQueue === false)) {
		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(0xff0000)
					//.setDescription(`No hay nada después de [${ song.title }](${ song.uri }) en la cola.`),
					.setDescription(`La última canción de la lista es:\n [${ song.title }](${ song.uri })`),
			],
		})}
		
		player.stop();
		
		interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription("✅ | **¡Saltada!**"),
			],
		});
	});

module.exports = command;
