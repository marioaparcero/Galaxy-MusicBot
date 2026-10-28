const { ContextMenuCommandBuilder } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const escapeMarkdown = require("discord.js").escapeMarkdown;
const yt = require("youtube-sr").default;

function normalizeYoutubeQuery(query) {
  const trimmed = (query ?? "").trim();
  if (!trimmed) return trimmed;

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const isYouTubeHost = ["youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be", "youtube-nocookie.com"].includes(hostname);

    if (!isYouTubeHost) return trimmed;

    const listId = parsed.searchParams.get("list");
    const videoId = parsed.searchParams.get("v");

    if (videoId && (parsed.pathname === "/watch" || listId)) {
      const sanitized = new URL("https://www.youtube.com/watch");
      sanitized.searchParams.set("v", videoId);
      if (listId) {
        sanitized.searchParams.set("list", listId);
      }
      return sanitized.toString();
    }

    if (listId && (parsed.pathname === "/playlist" || parsed.pathname.startsWith("/playlist/"))) {
      return `https://www.youtube.com/playlist?list=${listId}`;
    }

    if (hostname === "youtu.be") {
      const shortVideoId = parsed.pathname.replace(/^\/+/, "");
      if (shortVideoId) return `https://www.youtube.com/watch?v=${shortVideoId}`;
    }
  } catch (_) {
    // Ignorar URLs no válidas y mantener la consulta original.
  }

  return trimmed;
}

function isYouTubePlaylistUrl(query) {
  const trimmed = (query ?? "").trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (!["youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be", "youtube-nocookie.com"].includes(hostname)) {
      return false;
    }

    const listId = parsed.searchParams.get("list");
    return Boolean(listId || parsed.pathname === "/playlist" || parsed.pathname.startsWith("/playlist/"));
  } catch (_) {
    return false;
  }
}

async function extractPlaylistVideoIds(playlistUrl) {
  try {
    const res = await fetch(playlistUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
    });

    if (!res.ok) {
      return [];
    }

    const html = await res.text();
    const matches = [
      ...html.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g),
      ...html.matchAll(/(?:\/watch\?v=|\/vi\/)([A-Za-z0-9_-]{11})/g),
    ];

    const unique = [...new Set(matches.map((match) => match[1]).filter(Boolean))];
    return unique.slice(0, 50);
  } catch (_) {
    return [];
  }
}

async function searchPlaylistFallback(player, query, user) {
  const playlistUrl = normalizeYoutubeQuery(query);
  if (!isYouTubePlaylistUrl(playlistUrl)) {
    return { loadType: "empty" };
  }

  try {
    const videoIds = await extractPlaylistVideoIds(playlistUrl);
    if (!videoIds.length) {
      return { loadType: "empty" };
    }

    const tracks = [];
    for (const videoId of videoIds) {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const res = await player.search(videoUrl, user).catch(() => null);
      if (res && res.tracks && res.tracks.length > 0) {
        tracks.push(...res.tracks);
      }
    }

    if (!tracks.length) {
      return { loadType: "empty" };
    }

    return {
      loadType: "playlist",
      playlist: {
        name: "YouTube Playlist",
        duration: tracks.reduce((sum, track) => sum + (track.duration || 0), 0),
      },
      tracks,
    };
  } catch (_) {
    return { loadType: "error" };
  }
}

async function searchWithFallback(player, query, user) {
  const playlistUrl = normalizeYoutubeQuery(query);
  if (isYouTubePlaylistUrl(playlistUrl)) {
    const playlistRes = await player.search(playlistUrl, user).catch(() => ({ loadType: "error" }));
    if (playlistRes && playlistRes.loadType !== "empty" && playlistRes.tracks && playlistRes.tracks.length > 0) {
      return playlistRes;
    }

    return searchPlaylistFallback(player, playlistUrl, user);
  }

  const firstRes = await player.search(query, user).catch(() => ({ loadType: "empty" }));
  if (firstRes && firstRes.loadType !== "empty" && firstRes.tracks && firstRes.tracks.length > 0) {
    return firstRes;
  }

  const normalized = (query ?? "").trim().replace(/\s+/g, " ");
  if (!normalized) return { loadType: "empty" };

  const variants = new Set([normalized, `${normalized} song`, `${normalized} music`, `${normalized} official`, `${normalized} video`]);
  for (const term of variants) {
    try {
      const ytResults = await yt.search(term, { safeSearch: false, limit: 5 });
      const firstUrl = ytResults?.find((item) => item?.url)?.url;
      if (!firstUrl) continue;

      const fallbackRes = await player.search(firstUrl, user).catch(() => ({ loadType: "empty" }));
      if (fallbackRes.loadType !== "empty" && fallbackRes.tracks && fallbackRes.tracks.length > 0) {
        return fallbackRes;
      }
    } catch (_) {
      // Ignorar errores del fallback de YouTube y continuar con la siguiente búsqueda.
    }
  }

  return firstRes;
}

module.exports = {
  command: new ContextMenuCommandBuilder().setName("Play Song").setType(3),

  /**
   * This function will handle context menu interaction
   * @param {import("../lib/DiscordMusicBot")} client
   * @param {import("discord.js").GuildContextMenuInteraction} interaction
   */
  run: async (client, interaction, options) => {
    let channel = await client.getChannel(client, interaction);
    if (!channel) {
      return;
    }

    let node = await client.getLavalink(client);
    if (!node) {
      return interaction.reply({
        embeds: [client.ErrorEmbed("El servidor de música no está conectado")],
      });
    }

    let player = client.createPlayer(interaction.channel, channel);

    if (player.state !== "CONNECTED") {
      player.connect();
    }

    if (channel.type == "GUILD_STAGE_VOICE") {
      setTimeout(() => {
        if (interaction.guild.me.voice.suppress == true) {
          try {
            interaction.guild.me.voice.setSuppressed(false);
          } catch (e) {
            interaction.guild.me.voice.setRequestToSpeak(true);
          }
        }
      }, 2000); // Need this because discord api is buggy asf, and without this the bot will not request to speak on a stage - Darren
    }

    const ret = await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.config.embedColor)
          .setDescription(":mag_right: **Buscando...**"),
      ],
      withResponse: true,
    });

    const rawQuery =
      interaction.channel.messages.cache.get(interaction.targetId).content ??
      (await interaction.channel.messages.fetch(interaction.targetId));
    const query = normalizeYoutubeQuery(rawQuery);
    let res = await searchWithFallback(player, query, interaction.user).catch((err) => {
      client.error(err);
      return {
        loadType: "error",
      };
    });

    if (res.loadType === "error") {
      if (!player.queue.current) {
        player.destroy();
      }
      await interaction
        .editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff0000)
              .setDescription("Hubo un error al buscar"),
          ],
        })
        .catch(this.warn);
    }

    if (res.loadType === "empty") {
      if (!player.queue.current) {
        player.destroy();
      }
      await interaction
        .editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff0000)
              .setDescription("No se encontraron resultados"),
          ],
        })
        .catch(this.warn);
    }

    if (res.loadType === "track" || res.loadType === "search") {
      player.queue.add(res.tracks[0]);

      if (!player.playing && !player.paused && !player.queue.length) {
        player.play();
      }
      var title = escapeMarkdown(res.tracks[0].title);
      var title = title.replace(/\]/g, "");
      var title = title.replace(/\[/g, "");
      let addQueueEmbed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setAuthor({ name: `Agregado a la cola`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) }) //client.config.iconURL
        //.setAuthor({ name: "Agregado a la cola", iconURL: client.config.iconURL })
        //.setAuthor({ name: `Agregado a la cola por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setDescription(`[${title}](${res.tracks[0].uri})` || "Sin título")
        .setURL(res.tracks[0].uri)
        //.setTimestamp()
        //.setFooter({ text: `Agregado a la cola por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .addFields(
          {
            name: "Añadido por",
            value: `<@${interaction.user.id}>`,
            inline: true,
          },
          {
            name: "Duración",
            value: res.tracks[0].isStream
              ? `\`LIVE 🔴 \``
              : `\`${client.ms(res.tracks[0].duration, {
                  colonNotation: true,
                  secondsDecimalDigits: 0,
                })}\``,
            inline: true,
          }
        );

      try {
        addQueueEmbed.setThumbnail(
          res.tracks[0].displayThumbnail("maxresdefault")
        );
      } catch (err) {
        addQueueEmbed.setThumbnail(res.tracks[0].thumbnail);
      }

      if ((player.queue.length + (player.queue.current ? 1 : 0)) > 1) {
        addQueueEmbed.addFields({
          name: "Posición en cola",
          value: `${player.queue.length}`,
          inline: true,
        });
      }

      await interaction.editReply({ embeds: [addQueueEmbed] }).catch(this.warn);
    }

    if (res.loadType === "playlist") {
      player.queue.add(res.tracks);

      if (
        !player.playing &&
        !player.paused &&
        (player.queue.length + (player.queue.current ? 1 : 0)) === res.tracks.length
      ) {
        player.play();
      }

      let playlistEmbed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setAuthor({
          name: "Lista de reproducción agregada a la cola",
          iconURL: client.config.iconURL,
        })
        .setThumbnail(res.tracks[0].thumbnail)
        .setDescription(`[${res.playlist.name}](${query})`)
        .addFields(
          {
            name: "En cola",
            value: `\`${res.tracks.length}\` canciones`,
            inline: true,
          },
          {
            name: "Duración de la lista de reproducción",
            value: `\`${client.ms(res.playlist.duration, {
              colonNotation: true,
              secondsDecimalDigits: 0,
            })}\``,
            inline: true,
          }
        );

      await interaction.editReply({ embeds: [playlistEmbed] }).catch(this.warn);
    }

    if (ret) setTimeout(() => interaction.deleteReply().catch((e) => {}), 20000);
    return ret;
  },
};
