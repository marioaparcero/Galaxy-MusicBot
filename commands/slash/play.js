const SlashCommand = require("../../lib/SlashCommand");
const { EmbedBuilder } = require("discord.js"); // Routes, 
const escapeMarkdown = require("discord.js").escapeMarkdown;

const command = new SlashCommand()
  .setName("play")
  .setNameLocalizations({
		'es-ES': 'play',
	})
  .setDescription(
    "Searches and plays the requested song \nSupports: \nYoutube, Spotify, Deezer, Apple Music"
  )
  .setDescriptionLocalizations({
		'es-ES': 'Busca y reproduce la canción solicitada \nSoporta: \nYoutube, Spotify, Deezer, Apple Music',
  })
  .addStringOption((option) =>
    option
      .setName("query")
      .setNameLocalizations({
        'es-ES': 'canción',
      })
      .setDescription("What am I looking for?")
      .setDescriptionLocalizations({
        'es-ES': '¿Qué estoy buscando?',
      })
      .setAutocomplete(true)
      .setRequired(true)
  )
  .setRun(async (client, interaction, options) => {
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
        if (interaction.guild.members.me.voice.suppress == true) {
          try {
            interaction.guild.members.me.voice.setSuppressed(false);
          } catch (e) {
            interaction.guild.members.me.voice.setRequestToSpeak(true);
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

    let query = options.getString("query", true);
    let res = await player.search(query, interaction.user).catch((err) => { //`:musical_note: ${query}`
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
      client.warn(`[DEBUG] Track added to queue. Queue length: ${player.queue.length}. Playing: ${player.playing}. Paused: ${player.paused}`);

      if (!player.playing && !player.paused && !player.queue.length) {
        client.warn(`[DEBUG] Llamando a player.play()...`);
        player.play().then(() => client.warn(`[DEBUG] player.play() promesa resuelta.`)).catch(e => client.error(`[DEBUG] player.play() ERROR: ${e}`));
      }
      var title = escapeMarkdown(res.tracks[0].title);
      var title = title.replace(/\]/g, "");
      var title = title.replace(/\[/g, "");

      let addQueueEmbed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setAuthor({ name: `Agregado a la cola`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) }) //client.config.iconURL
        //.setAuthor({ name: `Agregado a la cola por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        // .setAuthor({
        //   name: "Agregado a la cola",
        //   iconURL: client.config.iconURL,
        // })
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
  });

module.exports = command;
