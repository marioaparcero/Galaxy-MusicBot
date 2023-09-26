const { MessageEmbed } = require("discord.js");
const escapeMarkdown = require('discord.js').Util.escapeMarkdown;
const SlashCommand = require("../../lib/SlashCommand");
const prettyMilliseconds = require("pretty-ms");

const command = new SlashCommand()
	.setName("nowplaying")
	.setNameLocalizations({
		'es-ES': 'mostrarcanción',
	})
	.setDescription("Shows the song currently playing in the voice channel.")
	.setDescriptionLocalizations({
		'es-ES': 'Muestra la canción que se reproduce actualmente en el canal de voz.',
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
						.setDescription("El bot no está en un canal."),
				],
				ephemeral: true,
			});
		}
		
		if (!player.playing) {
			return interaction.reply({
				embeds: [
					new MessageEmbed()
						.setColor("RED")
						.setDescription("No hay nada reproduciendo."),
				],
				ephemeral: true,
			});
		}
		
		const song = player.queue.current;
        var title = escapeMarkdown(song.title)
        var title = title.replace(/\]/g,"")
        var title = title.replace(/\[/g,"")
		const embed = new MessageEmbed()
			.setColor(client.config.embedColor)
			.setAuthor({ name: "Reproduciendo ahora ♪", iconURL: client.config.iconURL }) //Ahora suena ♪
			// show who requested the song via setField, also show the duration of the song
			.setFields([
				{
					name: "Solicitado por",
					value: `<@${ song.requester.id }>`,
					inline: true,
				},
				// show duration, if live show live
				{
					name: "Duración",
					value: song.isStream
						? `\`LIVE\``
						: `\`${ prettyMilliseconds(player.position, {
							secondsDecimalDigits: 0,
						}) } / ${ prettyMilliseconds(song.duration, {
							secondsDecimalDigits: 0,
						}) }\``,
					inline: true,
				},
			])
			// show the thumbnail of the song using displayThumbnail("maxresdefault")
			.setThumbnail(song.displayThumbnail("maxresdefault"))
			// show the title of the song and link to it
			.setDescription(`[${ title }](${ song.uri })`);
		return interaction.reply({ embeds: [embed] });
	});
module.exports = command;
