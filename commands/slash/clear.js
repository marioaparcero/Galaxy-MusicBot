const SlashCommand = require("../../lib/SlashCommand");
const { MessageEmbed } = require("discord.js");

const command = new SlashCommand()
	.setName("clear")
	.setNameLocalizations({
		'es-ES': 'borrar',
	})
	.setDescription("Clear all tracks from queue")
	.setDescriptionLocalizations({
		'es-ES': 'Borrar todas las pistas de la cola',
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
						.setDescription("Nada se está reproduciendo ahora."),
				],
				ephemeral: true,
			});
		}
		
		if (!player.queue || !player.queue.length || player.queue.length === 0) {
			let cembed = new MessageEmbed()
				.setColor(client.config.embedColor)
				.setDescription("❌ | **Inválido, no hay suficiente pista para ser despejado.**");
			
			return interaction.reply({ embeds: [cembed], ephemeral: true });
		}
		
		player.queue.clear();
		
		let clearEmbed = new MessageEmbed()
			.setColor(client.config.embedColor)
			.setDescription(`✅ | **¡Cola limpiada!**`);
		
		return interaction.reply({ embeds: [clearEmbed] });
	});

module.exports = command;