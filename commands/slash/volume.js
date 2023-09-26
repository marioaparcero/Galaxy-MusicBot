const SlashCommand = require("../../lib/SlashCommand");
const { MessageEmbed } = require("discord.js");

const command = new SlashCommand()
	.setName("volume")
	.setNameLocalizations({
		'es-ES': 'volumen',
	})
	.setDescription("Change the volume of the current song.")
	.setDescriptionLocalizations({
		'es-ES': 'Cambia el volumen de la canción actual.',
  	})
	.addNumberOption((option) =>
		option
			.setName("amount")
			.setDescription("Amount of volume you want to change. Ex: 10")
			.setDescriptionLocalizations({
				'es-ES': 'Cantidad de volumen que desea cambiar. Ej: 10',
		  	})
			.setRequired(false),
	)
	.setRun(async (client, interaction) => {
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
						.setDescription("No se está reproduciendo música."),
				],
				ephemeral: true,
			});
		}
		
		let vol = interaction.options.getNumber("amount");
		if (!vol || vol < 1 || vol > 125) {
			return interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor(client.config.embedColor)
						.setDescription(
							`:loud_sound: | Volumen actual **${ player.volume }**`,
						),
				],
			});
		}
		
		player.setVolume(vol);
		return interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor(client.config.embedColor)
					.setDescription(
						`:loud_sound: | Se ha cambiado el volumen a **${ player.volume }**`,
					),
			],
		});
	});

module.exports = command;
