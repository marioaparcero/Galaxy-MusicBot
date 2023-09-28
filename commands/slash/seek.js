const SlashCommand = require("../../lib/SlashCommand");
const { MessageEmbed } = require("discord.js");
const ms = require("ms");

const command = new SlashCommand()
	.setName("seek")
	.setNameLocalizations({
		'es-ES': 'avanzar',
	})
	.setDescription("Seek to a specific time in the current song.")
	.setDescriptionLocalizations({
		'es-ES': 'Busque un momento específico en la canción actual.',
  	})
	.addStringOption((option) =>
		option
			.setName("time")
			.setNameLocalizations({
				'es-ES': 'tiempo',
			})
			.setDescription("Seek to time you want. Ex 1h 30m | 2h | 100m | 50s")
			.setDescriptionLocalizations({
				'es-ES': 'Busca el momento que quieras. Ejemplo 1h 30m | 2h | 100m | 50s',
		  	})
			.setRequired(true),
	)
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
						.setDescription("No hay música reproduciéndose."),
				],
				ephemeral: true,
			});
		}
		
		await interaction.deferReply();

		const rawArgs = interaction.options.getString("time");
		const args = rawArgs.split(' ');
		var rawTime = [];
		for (i = 0; i < args.length; i++){
			rawTime.push(ms(args[i]));
		}
		const time = rawTime.reduce((a,b) => a + b, 0);
		const position = player.position;
		const duration = player.queue.current.duration;
		
		if (time <= duration) {
			player.seek(time);
			return interaction.editReply({
				embeds: [
					new MessageEmbed()
						.setColor(client.config.embedColor)
						.setDescription(
							`⏩ | **${ player.queue.current.title }** ha sido ${
								time < position? "rewound" : "seeked"
							} to **${ ms(time) }**`,
						),
				],
			});
		} else {
			return interaction.editReply({
				embeds: [
					new MessageEmbed()
						.setColor(client.config.embedColor)
						.setDescription(
							`No se puede buscar la pista que se está reproduciendo actualmente. Esto puede deberse a que se ha excedido la duración de la pista o a un formato de hora incorrecto. Por favor revisa e intenta de nuevo`,
						),
				],
			});
		}
	});

module.exports = command;
