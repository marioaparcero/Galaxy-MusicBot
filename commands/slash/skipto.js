const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("saltar")
	.setNameLocalizations({
		'en-US': 'skipto',
		'en-GB': 'skipto',
	})
	.setDescription("🎧 Skip to a specific song in the queue")
	.setDescriptionLocalizations({
		'es-ES': '🎧 Salta a una canción específica en la cola', //Salta una o más canciones en la cola
  	})
	.addNumberOption((option) =>
		option
			.setName("canciones")
			.setDescription("El número de pistas a saltar") //Cantidad de canciones a saltar
			.setRequired(true),
	)
	
	.setRun(async (client, interaction, options) => {
		const args = interaction.options.getNumber("canciones");
		//const duration = player.queue.current.duration
		
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
						.setDescription("No estoy en un canal."),
				],
				flags: 64,
			});
		}
		
		await interaction.deferReply();
		
		const position = Number(args);
		
		try {
			if (!position || position < 0 || position > player.queue.length) {
				let thing = new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription("❌ | ¡Posición inválida!");
				return interaction.editReply({ embeds: [thing] });
			}
			
			player.queue.remove(0, position - 1);
			player.stop();
			
			let thing = new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setDescription("✅ | Posición saltada " + position);
			
			return interaction.editReply({ embeds: [thing] });
		} catch {
			if (position === 1) {
				player.stop();
			}
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor(client.config.embedColor)
						.setDescription("✅ | Posición saltada " + position),
				],
			});
		}
	});

module.exports = command;
