const SlashCommand = require("../../lib/SlashCommand");
const { MessageEmbed } = require("discord.js");
const prettyMilliseconds = require("pretty-ms");

const command = new SlashCommand()
	.setName("save")
	.setNameLocalizations({
		'es-ES': 'guardar',
	})
	.setDescription("Saves current song to your DM's")
	.setDescriptionLocalizations({
		'es-ES': 'Guarda la canción actual en tu DM.',
  	})
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
						.setDescription("No hay música sonando en este momento."),
				],
				ephemeral: true,
			});
		}
		
		const sendtoDmEmbed = new MessageEmbed()
			.setColor(client.config.embedColor)
			.setAuthor({
				name: "Pista guardada",
				iconURL: `${ interaction.user.displayAvatarURL({ dynamic: true }) }`,
			})
			.setDescription(
				`**[${ player.queue.current.title }](${ player.queue.current.uri }) guardados en tu DM**`,
			)
			.addFields(
				{
					name: "Duración de la pista",
					value: `\`${ prettyMilliseconds(player.queue.current.duration, {
						colonNotation: true,
					}) }\``,
					inline: true,
				},
				{
					name: "Autor de la pista",
					value: `\`${ player.queue.current.author }\``,
					inline: true,
				},
				{
					name: "Servidor solicitado",
					value: `\`${ interaction.guild }\``,
					inline: true,
				},
			);
		
		interaction.user.send({ embeds: [sendtoDmEmbed] });
		
		return interaction.reply({
			embeds: [
				new MessageEmbed()
					.setColor(client.config.embedColor)
					.setDescription(
						"Por favor revisa tus **DM**. Si no recibió ningún mensaje mío, asegúrese de que sus **DM** estén abiertos",
					),
			],
			ephemeral: true,
		});
	});

module.exports = command;
