const { MessageEmbed } = require("discord.js");
/**
 *
 * @param {import("../lib/DiscordMusicBot")} client
 * @param {import("discord.js").ButtonInteraction} interaction
 */
module.exports = async (client, interaction) => {
	let guild = client.guilds.cache.get(interaction.customId.split(":")[1]);
	let property = interaction.customId.split(":")[2];
	let player = client.manager.get(guild.id);

	if (!player) {
		await interaction.reply({
			embeds: [
				client.Embed("❌ | **No hay ningún reproductor para controlar en este servidor.**"),
			],
		});
		setTimeout(() => {
			interaction.deleteReply();
		}, 5000);
		return;
	}
	if (!interaction.member.voice.channel) {
		const joinEmbed = new MessageEmbed()
			.setColor(client.config.embedColor)
			.setDescription(
				"❌ | **¡Debes estar en un canal de voz para usar esta acción!**",
			);
		return interaction.reply({ embeds: [joinEmbed], ephemeral: true });
	}

	if (
		interaction.guild.members.me.voice.channel &&
		!interaction.guild.members.me.voice.channel.equals(interaction.member.voice.channel)
	) {
		const sameEmbed = new MessageEmbed()
			.setColor(client.config.embedColor)
			.setDescription(
				"❌ | **¡Debes estar en el mismo canal de voz que yo para usar esta acción!**",
			);
		return await interaction.reply({ embeds: [sameEmbed], ephemeral: true });
	}

	if (property === "Stop") {
		player.queue.clear();
		player.stop();
		player.set("autoQueue", false);
		client.warn(`Reproductor: ${ player.options.guild } | El reproductor ha sido parado con éxito`); // ha sido detenido
		const msg = await interaction.channel.send({
			embeds: [
				client.Embed(
					"⏹️ | **El reproductor ha sido parado con éxito**",
				),
			],
		});
		setTimeout(() => {
			msg.delete();
		}, 5000);

		interaction.update({
			components: [client.createController(player.options.guild, player)],
		});
		return;
	}

	// if theres no previous song, return an error.
	if (property === "Replay") {
		const previousSong = player.queue.previous;
		const currentSong = player.queue.current;
		const nextSong = player.queue[0]
        if (!player.queue.previous ||
            player.queue.previous === player.queue.current ||
            player.queue.previous === player.queue[0]) {
            
           return interaction.reply({
                        ephemeral: true,
			embeds: [
				new MessageEmbed()
					.setColor("RED")
					.setDescription(`No se ha reproducido ninguna canción anterior.`),
			],
		});
    }
		if (previousSong !== currentSong && previousSong !== nextSong) {
			player.queue.splice(0, 0, currentSong)
			player.play(previousSong);
			return interaction.deferUpdate();
		}
	}

	if (property === "PlayAndPause") {
		if (!player || (!player.playing && player.queue.totalSize === 0)) {
			const msg = await interaction.channel.send({
                               ephemeral: true,
				embeds: [
					new MessageEmbed()
						.setColor("RED")
						.setDescription("No hay ninguna canción sonando en este momento."),
				],
			});
			setTimeout(() => {
				msg.delete();
			}, 5000);
			return interaction.deferUpdate();
		} else {

			if (player.paused) {
				player.pause(false);
			} else {
				player.pause(true);
			}
			client.warn(`Reproductor: ${ player.options.guild } | El reproductor ha sido ${ player.paused? "pausado" : "reanudado" }`);

			return interaction.update({
				components: [client.createController(player.options.guild, player)],
			});
		}
	}

	if (property === "Next") {
                const song = player.queue.current;
	        const autoQueue = player.get("autoQueue");
                if (player.queue[0] == undefined && (!autoQueue || autoQueue === false)) {
		return interaction.reply({
                        ephemeral: true,
			embeds: [
				new MessageEmbed()
					.setColor("RED")
					//.setDescription(`No hay nada después [${ song.title }](${ song.uri }) en la cola.`),
					.setDescription(`La última canción de la lista es:\n [${ song.title }](${ song.uri })`),
			],
		})} else player.stop();
		return interaction.deferUpdate
    }

	if (property === "Loop") {
		if (player.trackRepeat) {
			player.setTrackRepeat(false);
			player.setQueueRepeat(true);
		} else if (player.queueRepeat) {
			player.setQueueRepeat(false);
		} else {
			player.setTrackRepeat(true);
		}
		client.warn(`Reproductor: ${player.options.guild} | Bucle ${player.trackRepeat ? "activado" : player.queueRepeat ? "en cola" : "apagado"} en el reproductor`);

		interaction.update({
			components: [client.createController(player.options.guild, player)],
		});
		return;
	}
	if (property === "Queue") {
		const queue = player.queue;
		if (queue.length === 0) {
			interaction.reply({
				ephemeral: true,
				embeds: [
					new MessageEmbed()
						.setColor("RED")
						.setDescription("La cola de reproducción está vacía.\nPuedes añadir más con el comando </play:1155720709063065647>"),
				],
			});
		} else {
			// TODO: Revisar que no haya overbuffer con las lista de reprodución y controlar las páginas de la lista.
			const escapeMarkdown = require('discord.js').Util.escapeMarkdown;
			const load = require("lodash");
			const pms = require("pretty-ms");

			// let queueDuration = player.queue.duration.valueOf()
			// if (player.queue.current.isStream) {
			// 	queueDuration -= player.queue.current.duration
			// }
			// for (let i = 0; i < player.queue.length; i++) {
			// 	if (player.queue[i].isStream) {
			// 		queueDuration -= player.queue[i].duration
			// 	}
			// }
			
			const mapping = player.queue.map(
				(t, i) => `\` ${ ++i } \` [${ t.title }](${ t.uri }) [${ t.requester }]`,
			);
			const chunk = load.chunk(mapping, 10);
			//const pages = chunk.map((s) => s.join("\n"));
			// let page = interaction.options.getNumber("page");
			// if (!page) {
			// 	page = 0;
			// }
			// if (page) {
			// 	page = page - 1;
			// }
			// if (page > pages.length) {
			// 	page = 0;
			// }
			// if (page < 0) {
			// 	page = 0;
			// }
			let song = player.queue.current;
			var title = escapeMarkdown(song.title)
			var title = title.replace(/\]/g,"")
			var title = title.replace(/\[/g,"")
			const queueEmbed = new MessageEmbed()
				.setColor(client.config.embedColor)
				.setTitle("♪ Cola de Reproducción")
				// .setDescription(
				// 	`**♪ | Reproduciendo ahora:** [${ title }](${ song.uri }) [${ player.queue.current.requester }]\n\n**Pistas en cola**\n`, //\n${ pages[page] }`,
				// )
				.setDescription(`A continuación se muestra la cola de reproducción:\n\n**Canciones en cola (${player.queue.totalSize - 1})**\n`) //Pistas en cola - Canciones en espera //ㅤㅤㅤㅤㅤPara saltar: </saltar:1156301243359187028>
				.addFields(
					queue.map((track, index) => ({
						name: `\n`,
						//name: `\`${index + 1}\`. [${ track.title }](${ song.uri })`,
						//name: `${index + 1}. ${track.title}`,
						value: `\`${index + 1}\`. [${ track.title }](${ song.uri }) [${ track.requester }]\n Duración: ${track.isStream ? "LIVE" : pms(track.duration, { colonNotation: true })}`,
					})),
					// {
					// 	name: "Para saltar:",
					// 	value: `</saltar:1156301243359187028>\n\n**${player.queue.totalSize - 1} canciones en espera**\nNo hay canciones en espera. ¡Agrega una!`
					// }
					{
						name: " ",
						value: `Para saltar a una canción: </saltar:1156301243359187028>\n\n`
					}
					// {
					// 	name: `**${player.queue.totalSize - 1} canciones en espera**`,
					// 	value: `\nNo hay canciones en espera. ¡Agrega una!`
					// }
				);
			interaction.reply({ embeds: [queueEmbed], ephemeral: true });
		}
		return;
	}

	return interaction.reply({
		ephemeral: true,
		content: "❌ | **Opción de controlador desconocida**",
	});
};
