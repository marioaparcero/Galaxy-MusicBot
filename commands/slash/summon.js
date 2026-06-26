const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js");

const command = new SlashCommand()
	.setName("summon")
	.setNameLocalizations({
		'es-ES': 'invocar',
	})
	.setDescription("Summons the bot to the channel.")
	.setDescriptionLocalizations({
		'es-ES': 'Convoca el bot al canal.',
  	})
	.setRun(async (client, interaction, options) => {
		let channel = await client.getChannel(client, interaction);
		if (!interaction.member.voice.channel) {
			const joinEmbed = new EmbedBuilder()
				.setColor(client.config.embedColor)
				.setDescription(
					"❌ | **Debes estar en un canal de voz para usar este comando.**",
				);
			return interaction.reply({ embeds: [joinEmbed], flags: 64 });
		}
		
		let player = client.manager.players.get(interaction.guild.id);
		if (!player) {
			player = client.createPlayer(interaction.channel, channel);
			player.connect(true);
		}
		
		if (channel.id !== player.options.voiceChannelId) {
			player.setVoiceChannel(channel.id);
			player.connect();
		}
		
		interaction.reply({
			embeds: [
				client.Embed(`:thumbsup: | **Se ha unido con éxito a <#${ channel.id }>!**`),
			],
		});
	});

module.exports = command;
