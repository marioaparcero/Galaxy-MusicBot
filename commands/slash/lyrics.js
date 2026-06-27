const SlashCommand = require("../../lib/SlashCommand");
const {
	ActionRowBuilder,
	StringSelectMenuBuilder,
	ButtonBuilder,
	EmbedBuilder
} = require("discord.js");
const fetch = require("node-fetch");

const command = new SlashCommand()
	.setName("lyrics")
	.setNameLocalizations({
		'es-ES': 'letras',
	})
	.setDescription("Get the lyrics of a song")
	.setDescriptionLocalizations({
		'es-ES': 'Obtener la letra de una canción',
  	})
	.addStringOption((option) =>
		option
			.setName("song")
			.setNameLocalizations({
				'es-ES': 'canción',
			})
			.setDescription("The song to get lyrics for")
			.setDescriptionLocalizations({
				'es-ES': 'La canción para obtener letra',
		  	})
			.setRequired(false),
	)
	.setRun(async (client, interaction, options) => {
		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(client.config.embedColor)
					.setDescription("🔎 | **Buscando...**"),
			],
		});

		let player;
		if (client.manager) {
			player = client.manager.players.get(interaction.guild.id);
		} else {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor(0xff0000)
						.setDescription("El servidor de música no está conectado"),
				],
			});
		}

		const args = interaction.options.getString("song");
		if (!args && !player) {
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor(0xff0000)
						.setDescription("No hay nada reproduciendo"),
				],
			});
		}

		let currentTitle = ``;
		const phrasesToRemove = [
			"Full Video", "Full Audio", "Official Music Video", "Lyrics", "Lyrical Video",
			"Feat.", "Ft.", "Official", "Audio", "Video", "HD", "4K", "Remix", "Lyric Video", "Lyrics Video", "8K", 
			"High Quality", "Animation Video", "\\(Official Video\\. .*\\)", "\\(Music Video\\. .*\\)", "\\[NCS Release\\]",
			"Extended", "DJ Edit", "with Lyrics", "Lyrics", "Karaoke",
			"Instrumental", "Live", "Acoustic", "Cover", "\\(feat\\. .*\\)"
		];
		if (!args) {
			currentTitle = player.queue.current.title;
			currentTitle = currentTitle
				.replace(new RegExp(phrasesToRemove.join('|'), 'gi'), '')
				.replace(/\s*([\[\(].*?[\]\)])?\s*(\|.*)?\s*(\*.*)?$/, '');
		}
		let query = args ? args : currentTitle;
		let lyricsResults = [];

		fetch(`https://api.lyrics.ovh/suggest/${encodeURIComponent(query)}`)
		.then(res => res.json())
		.then(async (lyricsData) => {
			const data = lyricsData.data || [];
			if (data.length !== 0) {
				for (let i = 0; i < client.config.lyricsMaxResults; i++) {
					if (data[i]) {
						lyricsResults.push({
							label: `${data[i].title}`.substring(0, 100),
							description: `${data[i].artist.name}`.substring(0, 100),
							value: i.toString()
						});
					} else { break }
				}

				const menu = new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId("choose-lyrics")
						.setPlaceholder("Elige una canción")
						.addOptions(lyricsResults),
				);

				let selectedLyrics = await interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setColor(client.config.embedColor)
							.setDescription(
								`Éstos son algunos de los resultados que encontré para \`${query}\`. Elija una canción para mostrar la letra en \`30 segundos\`.`
							),
					], components: [menu],
				});

				const filter = (button) => button.user.id === interaction.user.id;

				const collector = selectedLyrics.createMessageComponentCollector({
					filter,
					time: 30000,
				});

				collector.on("collect", async (interaction) => {
					if (interaction.isStringSelectMenu()) {
						await interaction.deferUpdate();
						const song = data[parseInt(interaction.values[0])];
						const url = song.link || `https://lyrics.ovh/`;

						fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(song.artist.name)}/${encodeURIComponent(song.title)}`)
						.then(res => res.json())
						.then((lyricsRes) => {
							let lyricsText = lyricsRes.lyrics;

							const button = new ActionRowBuilder()
								.addComponents(
									new ButtonBuilder()
										.setCustomId('tipsbutton')
										.setLabel('Consejos')
										.setEmoji(`📌`)
										.setStyle(2),
									new ButtonBuilder()
										.setLabel('Fuente')
										.setURL(url)
										.setStyle(5),
								);

							const ovh_icon = 'https://i.imgur.com/8zRvwu4.png';
							let lyricsEmbed = new EmbedBuilder()
								.setColor(client.config.embedColor)
								.setTitle(`${song.title} - ${song.artist.name}`)
								.setURL(url)
								.setThumbnail(song.album ? song.album.cover_medium : client.config.iconURL)
								.setFooter({
									text: 'Letra proporcionada por lyrics.ovh',
									iconURL: ovh_icon
								})
								.setDescription(lyricsText);

							if (!lyricsText || lyricsText.length === 0) {
								lyricsEmbed
									.setDescription(`**Lamentablemente no pudimos obtener estas letras.**`)
									.setFooter({
										text: 'La letra no se encontró en lyrics.ovh.',
										iconURL: ovh_icon
									})
							}

							if (lyricsText.length > 4096) {
								lyricsText = lyricsText.substring(0, 4050) + "\n\n[...]";
								lyricsEmbed
									.setDescription(lyricsText + `\nLas letras eran demasiado largas.`)
							}

							return interaction.editReply({
								embeds: [lyricsEmbed],
								components: [button],
							});

						}).catch(err => {
							console.error(err);
							interaction.followUp({ content: "Error al obtener la letra de la canción.", flags: 64 });
						});
					}
				});

				collector.on("end", async (i) => {
					if (i.size == 0) {
						selectedLyrics.edit({
							content: null,
							embeds: [
								new EmbedBuilder()
									.setDescription(
										`No hay ninguna canción seleccionada. Tardaste demasiado en seleccionar una pista.`
									)
									.setColor(client.config.embedColor),
							], components: [],
						});
					}
				});

			} else {
				const button = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setEmoji(`📌`)
							.setCustomId('tipsbutton')
							.setLabel('Tips')
							.setStyle(2),
					);
				return interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setColor(0xff0000)
							.setDescription(
								`No se encontraron resultados para \`${query}\`!\nAsegúrate de haber escrito tu búsqueda correctamente.`,
							),
					], components: [button],
				});
			}
		}).catch((err) => {
			console.error(err);
			return interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor(0xff0000)
						.setDescription(
							`Ha ocurrido un error desconocido, verifique su consola.`,
						),
				],
			});
		});

		const collector = interaction.channel.createMessageComponentCollector({
			time: 1000 * 3600
		});

		collector.on('collect', async interaction => {
			if (interaction.customId === 'tipsbutton') {
				await interaction.deferUpdate();
				await interaction.followUp({
					embeds: [
						new EmbedBuilder()
							.setTitle(`Consejos de letras`)
							.setColor(client.config.embedColor)
							.setDescription(
								`Aquí tienes algunos consejos para conseguir la letra de tu canción correctamente. \n\n- 1. Intente agregar el nombre del artista delante del nombre de la canción.\n- 2. Intente buscar la letra manualmente proporcionando la consulta de la canción usando su teclado.\n- 3. Evite buscar letras en otros idiomas además del inglés.`,
							),
					], flags: 64, components: []
				});
			};
		});
	});

module.exports = command;
