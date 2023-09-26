const SlashCommand = require("../../lib/SlashCommand");
const { MessageEmbed } = require("discord.js");

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
						.setDescription("There are no songs to remove."),
				],
				ephemeral: true,
			});
		}
		
		await interaction.deferReply();
		
		const position = Number(args) - 1;
		if (position > player.queue.size) {
			let thing = new MessageEmbed()
				.setColor(client.config.embedColor)
				.setDescription(
					`Current queue has only **${ player.queue.size }** track`,
				);
			return interaction.editReply({ embeds: [thing] });
		}
		
		const song = player.queue[position];
		player.queue.remove(position);
		
		const number = position + 1;
		let removeEmbed = new MessageEmbed()
			.setColor(client.config.embedColor)
			.setDescription(`Removed track number **${ number }** from queue`);
		return interaction.editReply({ embeds: [removeEmbed] });
	});

module.exports = command;
