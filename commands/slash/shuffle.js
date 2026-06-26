const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("shuffle")
	.setNameLocalizations({
		'es-ES': 'aleatorio',
	})
	.setDescription("Randomizes the queue")
	.setDescriptionLocalizations({
		'es-ES': 'La cola se establece de forma aleatoria',
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
						.setDescription("No se está reproduciendo música.\nPuedes reproducir una con el comando </play:1155720709063065647>"),
				],
				flags: 64,
			});
		}
		
		if (!player.queue || !player.queue.length || player.queue.length === 0) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(0xff0000)
						.setDescription("No hay suficientes canciones en la cola."),
				],
				flags: 64,
			});
		}
		
		//  if the queue is not empty, shuffle the entire queue
		player.queue.shuffle();
		return interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription("🔀 | **Se ha mezclado la cola con éxito.**"),
			],
		});
	});

module.exports = command;
