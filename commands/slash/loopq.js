const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("loopq")
	.setNameLocalizations({
		'es-ES': 'repetircola',
	})
	.setDescription("Loop the current song queue")
	.setDescriptionLocalizations({
		'es-ES': 'Repetir la cola de canciones actual',
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
						.setDescription("No se está reproduciendo música."),
				],
				flags: 64,
			});
		}
		
		if (player.setQueueRepeat(!player.queueRepeat)) {
			;
		}
		const queueRepeat = player.queueRepeat? "enabled" : "disabled";
		
		interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(
						`:thumbsup: | **La cola de bucle ahora está \`${ queueRepeat }\`**`,
					),
			],
		});
	});

module.exports = command;
