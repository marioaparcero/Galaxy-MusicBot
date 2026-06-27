const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("stop")
	.setNameLocalizations({
		'es-ES': 'parar',
	})
	.setDescription("Stops whatever the bot is playing and leaves the voice channel\n(This command will clear the queue)")
	.setDescriptionLocalizations({
		'es-ES': 'Detiene lo que esté reproduciendo el bot y abandona el canal de voz\n(Este comando borrará la cola)',
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
						.setDescription("No estoy en un canal."),
				],
				flags: 64,
			});
		}
		
		try {
			await client.rest.put(`/channels/${player.options.voiceChannelId}/voice-status`, { body: { status: "" } });
		} catch (err) {
			// Ignorar si faltan permisos
		}
		
		if (player.twentyFourSeven) {
			player.queue.clear();
			player.stop();
			player.set("autoQueue", false);
		} else {
			player.destroy();
		}
		
		interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription(`:wave: | **¡Hasta luego!**`),
			],
		});
	});

module.exports = command;
