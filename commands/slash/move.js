const SlashCommand = require("../../lib/SlashCommand");
const { MessageEmbed } = require("discord.js");

const command = new SlashCommand()
	.setName("move")
	.setNameLocalizations({
		'es-ES': 'mover',
	})
	.setDescription("Moves track to a different position")
	.setDescriptionLocalizations({
		'es-ES': 'Mueve la pista a una posición diferente',
  	})
	.addIntegerOption((option) =>
		option
			.setName("track")
			.setNameLocalizations({
				'es-ES': 'pista',
			})
			.setDescription("The track number to move")
			.setDescriptionLocalizations({
				'es-ES': 'El número de pista a mover',
		  	})
			.setRequired(true),
	)
	.addIntegerOption((option) =>
		option
			.setName("position")
			.setDescription("La posición a la que mover la pista")
			.setRequired(true),
	)
	
	.setRun(async (client, interaction) => {
		const track = interaction.options.getInteger("track");
		const position = interaction.options.getInteger("position");
		
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
						.setDescription("No hay nada reproduciendo."),
				],
				ephemeral: true,
			});
		}
		
		let trackNum = Number(track) - 1;
		if (trackNum < 0 || trackNum > player.queue.length - 1) {
			return interaction.reply(":x: | **Número de pista no válido**");
		}
		
		let dest = Number(position) - 1;
		if (dest < 0 || dest > player.queue.length - 1) {
			return interaction.reply(":x: | **Número de posición no válido**");
		}
		
		const thing = player.queue[trackNum];
		player.queue.splice(trackNum, 1);
		player.queue.splice(dest, 0, thing);
		return interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor(client.config.embedColor)
					.setDescription(":white_check_mark: | **Pista movida**"),
			],
		});
	});

module.exports = command;
