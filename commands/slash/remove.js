const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("remove")
	.setNameLocalizations({
		'es-ES': 'eliminar',
	})
	.setDescription("Remove track you don't want from queue")
	.setDescriptionLocalizations({
		'es-ES': 'Elimina la pista que no quieres de la cola',
  	})
	.addNumberOption((option) =>
		option
			.setName("number")
			.setNameLocalizations({
				'es-ES': 'número',
			})
			.setDescription("Enter track number.")
			.setDescriptionLocalizations({
				'es-ES': 'Introduzca el número de pista.',
		  	})
			.setRequired(true),
	)
	
	.setRun(async (client, interaction) => {
		const args = interaction.options.getNumber("number");
		
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
						.setDescription("No hay canciones para eliminar."),
				],
				flags: 64,
			});
		}
		
		await interaction.deferReply();
		
		const position = Number(args) - 1;
		if (position > player.queue.length) {
			let thing = new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setDescription(
					`La cola actual tiene solo **${ player.queue.length }** pistas.`,
				);
			return interaction.editReply({ embeds: [thing] });
		}
		
		const song = player.queue[position];
		player.queue.remove(position);
		
		const number = position + 1;
		let removeEmbed = new EmbedBuilder()
			.setColor(client.config.embedColor)
			.setDescription(`Se eliminó la pista número **${ number }** de la cola.`);
		return interaction.editReply({ embeds: [removeEmbed] });
	});

module.exports = command;
