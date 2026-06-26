const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Collection,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  escapeMarkdown
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const prettyMilliseconds = require("pretty-ms");
const jsoning = require("jsoning"); // Documentation: https://jsoning.js.org/
const { Manager } = require("magmastream");
const ConfigFetcher = require("../util/getConfig");
const Logger = require("./Logger");
const Server = require("../api");
const getLavalink = require("../util/getLavalink");
const getChannel = require("../util/getChannel");
const colors = require("colors");
const { default: EpicPlayer } = require("./EpicPlayer");
class DiscordMusicBot extends Client {
  /**
   * Create the music client
   * @param {import("discord.js").ClientOptions} props - Client options
   */
  constructor(
    props = {
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
      ],
    }
  ) {
    super(props);

    ConfigFetcher().then((conf) => {
      this.config = conf;
      this.build();
    });

    //Load Events and stuff
    /**@type {Collection<string, import("./SlashCommand")} */
    this.slashCommands = new Collection();
    this.contextCommands = new Collection();

    this.logger = new Logger(path.join(__dirname, "..", "logs.log"));

    this.LoadCommands();
    this.LoadEvents();

    this.database = new jsoning("db.json");

    this.deletedMessages = new WeakSet();
    this.getLavalink = getLavalink;
    this.getChannel = getChannel;
    this.ms = prettyMilliseconds;
    this.commandsRan = 0;
    this.songsPlayed = 0;
  }

  /**
   * Send an info message
   * @param {string} text
   */
  log(text) {
    this.logger.log(text);
  }

  /**
   * Send an warning message
   * @param {string} text
   */
  warn(text) {
    this.logger.warn(text);
  }

  /**
   * Send an error message
   * @param {string} text
   */
  error(text) {
    this.logger.error(text);
  }

  /**
   * Build em
   */
  build() {
    this.warn("¡Bot iniciado!");
    this.login(this.config.token);
    this.server = this.config.enableDashboard ? new Server(this) : null;
    if (this.config.debug === true) {
      this.warn("¡El modo de depuración está habilitado!");
      this.warn("¡Habilítalo sólo si sabes lo que estás haciendo!");
      process.on("unhandledRejection", (error) => console.log(error));
      process.on("uncaughtException", (error) => console.log(error));
    } else {
      process.on("unhandledRejection", (error) => {
        return;
      });
      process.on("uncaughtException", (error) => {
        return;
      });
    }

    let client = this;

    /**
     * will hold at most 100 tracks, for the sake of autoqueue
     */
    let playedTracks = [];

    this.manager = new Manager({
      playNextOnEnd: true,
      nodes: this.config.nodes,
      retryDelay: this.config.retryDelay,
      retryAmount: this.config.retryAmount,
      clientName: `DiscordMusic/v${require("../package.json").version} (Bot: ${
        this.config.clientId
      })`,
      send: (payload) => {
        let guild = client.guilds.cache.get(payload.d.guild_id);
        if (guild) {
          guild.shard.send(payload);
        }
      },
      getUser: (id) => client.users.cache.get(id),
      getGuild: (id) => client.guilds.cache.get(id),
    })
      .on("nodeConnect", (node) =>
        this.log(
          `Node: ${node.options.identifier} | El nodo Lavalink está conectado.`
        )
      )
      .on("nodeReconnect", (node) =>
        this.warn(
          `Node: ${node.options.identifier} | El nodo Lavalink se está reconectando.`
        )
      )
      .on("nodeDestroy", (node) =>
        this.warn(
          `Node: ${node.options.identifier} | El nodo Lavalink está destruido.`
        )
      )
      .on("nodeDisconnect", (node) =>
        this.warn(
          `Node: ${node.options.identifier} | El nodo Lavalink está desconectado.`
        )
      )
      .on("nodeError", (node, err) => {
        this.warn(
          `Node: ${node.options.identifier} | El nodo Lavalink tiene un error: ${err.message}.`
        );
      });
      
    console.log("Manager instantiated:", !!this.manager);
      // on track error warn and create embed
      this.manager.on("trackError", (player, track, payload) => {
        this.warn(
          `Reproductor: ${player.options.guildId} | La pista tuvo un error: ${payload.exception ? payload.exception.message : "Desconocido"}.`
        );
        //console.log(err);
        let song = track || player.queue.current;
        if (!song) return;
        var title = escapeMarkdown(song.title)
        var title = title.replace(/\]/g,"")
        var title = title.replace(/\[/g,"")
        
        let errorEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("¡Error de reproducción!")
          .setDescription(`No se pudo cargar la pista: \`${title}\``)
          .setFooter({
            text: "¡Ups! ¡Algo salió mal pero no es tu culpa!",
          });
        client.channels.cache
          .get(player.options.textChannelId)
          .send({ embeds: [errorEmbed] });
      })

      .on("trackStuck", (player, track, payload) => {
        this.warn(`La pista se atascó: ${payload.thresholdMs}ms`);
        //console.log(err);
        let song = track || player.queue.current;
        if (!song) return;
        var title = escapeMarkdown(song.title)
        var title = title.replace(/\]/g,"")
        var title = title.replace(/\[/g,"")
        
        let errorEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("¡Error en la pista!")
          .setDescription(`No se pudo cargar la pista: \`${title}\``)
          .setFooter({
            text: "¡Ups! ¡Algo salió mal pero no es tu culpa!",
          });
        client.channels.cache
          .get(player.options.textChannelId)
          .send({ embeds: [errorEmbed] });
      })
      .on("playerMove", (player, oldChannel, newChannel) => {
        const guild = client.guilds.cache.get(player.options.guildId);
        if (!guild) {
          return;
        }
        const channel = guild.channels.cache.get(player.options.textChannelId);
        if (oldChannel === newChannel) {
          return;
        }
        if (newChannel === null || !newChannel) {
          if (!player) {
            return;
          }
          if (channel) {
            channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(client.config.embedColor)
                  .setDescription(`Desconectado de <#${oldChannel}>`),
              ],
            });
          }
          return player.destroy();
        } else {
          player.options.voiceChannelId = newChannel;
          setTimeout(() => player.pause(false), 1000);
          return undefined;
        }
      })
      .on("playerCreate", (player) => {
        player.set("twentyFourSeven", client.config.twentyFourSeven);
        player.set("autoQueue", client.config.autoQueue);
        player.set("autoPause", client.config.autoPause);
        player.set("autoLeave", client.config.autoLeave);
        this.warn(
          `Reproductor: ${
            player.options.guildId
          } | Se ha creado un reproductor en ${
            client.guilds.cache.get(player.options.guildId)
              ? client.guilds.cache.get(player.options.guildId).name
              : "un servidor"
          }`
        );
      })
      .on("playerDestroy", (player) => {
        this.warn(
          `Reproductor: ${player.options.guildId} | El reproductor ha sido destruido en ${client.guilds.cache.get(player.options.guildId)
              ? client.guilds.cache.get(player.options.guildId).name
              : "un servidor"
          }`
        )
        player.setNowplayingMessage(client, null);
      })
      // on error send error message
      .on("loadFailed", (node, type, error) =>
        this.warn(
          `Node: ${node.options.identifier} | Falló al cargar ${type}: ${error.message}`
        )
      )
      // on TRACK_START send message
      .on(
        "trackStart",
        /** @param {EpicPlayer} player */ async (player, track) => {
          this.songsPlayed++;
          playedTracks.push(track.identifier);
          if (playedTracks.length >= 100) {
            playedTracks.shift();
          }

          this.warn(
            `Reproductor: ${
              player.options.guildId
            } | La pista ha comenzado a reproducirse [${colors.blue(track.title)}]`
          );
            var title = escapeMarkdown(track.title)
            var title = title.replace(/\]/g,"")
            var title = title.replace(/\[/g,"")
          let trackStartedEmbed = this.Embed()
            .setAuthor({ name: "Reproduciendo ahora ♪", iconURL: this.config.iconURL }) //Ahora suena ♪
            .setDescription(
              `[${title}](${track.uri})` || "Sin descripciones"
            )
            .addFields(
              {
                name: "Solicitado por",
                value: `${track.requester || `<@${client.user.id}>`}`,
                inline: true,
              },
              {
                name: "Duración",
                value: track.isStream
                  ? `\`LIVE\``
                  : `\`${prettyMilliseconds(track.duration, {
                      colonNotation: true,
                    })}\``,
                inline: true,
              }
            );
          try {
            trackStartedEmbed.setThumbnail(
              track.displayThumbnail("maxresdefault")
            );
          } catch (err) {
            trackStartedEmbed.setThumbnail(track.thumbnail);
          }
          let nowPlaying = await client.channels.cache
            .get(player.options.textChannelId)
            .send({
              embeds: [trackStartedEmbed],
              components: [
                client.createController(player.options.guildId, player),
              ],
            })
            .catch(this.warn);
          player.setNowplayingMessage(client, nowPlaying);
       }
      )
    
      .on(
        "playerDisconnect",
          /** @param {EpicPlayer} */ async (player) => {
            if (player.twentyFourSeven) {
              player.queue.clear();
              player.stop();
              player.set("autoQueue", false);
            } else {
              player.destroy();
            }
          }
      )
    
      .on(
        "queueEnd",
        /** @param {EpicPlayer} */ async (player, track) => {
          const autoQueue = player.get("autoQueue");

          if (autoQueue) {
            const requester = player.get("requester");
            const identifier = track.identifier;
            const search = `https://www.youtube.com/watch?v=${identifier}&list=RD${identifier}`;
            const res = await player.search(search, requester);
            let nextTrackIndex;

            res.tracks.some((track, index) => {
              nextTrackIndex = index;
              return !playedTracks.includes(track.identifier);
            });

            if (res.exception) {
              client.channels.cache.get(player.options.textChannelId).send({
                embeds: [
                  new EmbedBuilder()
                    .setColor(0xff0000)
                    .setAuthor({
                      name: `${res.exception.severity}`,
                      iconURL: client.config.iconURL,
                    })
                    .setDescription(
                      `No se pudo cargar la pista.\n**ERR:** ${res.exception.message}`
                    ),
                ],
              });
              return player.destroy();
            }

            player.play(res.tracks[nextTrackIndex]);
          } else {
            const twentyFourSeven = player.get("twentyFourSeven");

            let queueEmbed = new EmbedBuilder()
              .setColor(client.config.embedColor)
              .setAuthor({
                name: "La cola ha terminado",
                iconURL: client.config.iconURL,
              })
              .setFooter({ text: "Cola finalizada" })
              .setTimestamp();
            let EndQueue = await client.channels.cache
              .get(player.options.textChannelId)
              .send({ embeds: [queueEmbed] });
            setTimeout(() => EndQueue.delete(true), 5000);
            try {
              if (!player.playing && !twentyFourSeven) {
                setTimeout(async () => {
                  if (!player.playing && player.state !== "DISCONNECTED") {
                    let disconnectedEmbed = new EmbedBuilder()
                      .setColor(client.config.embedColor)
                      .setAuthor({
                        name: "¡Desconectado!",
                        iconURL: client.config.iconURL,
                      })
                      .setDescription(
                        `El reproductor ha sido desconectado por inactividad.`
                      );
                    let Disconnected = await client.channels.cache
                      .get(player.options.textChannelId)
                      .send({ embeds: [disconnectedEmbed] });
                    setTimeout(() => Disconnected.delete(true), 6000);
                    player.destroy();
                  } else if (player.playing) {
                    client.warn(
                      `Reproductor: ${player.options.guildId} | Reproduciendo`
                    );
                  }
                }, client.config.disconnectTime);
              } else if (!player.playing && twentyFourSeven) {
                client.warn(
                  `Reproductor: ${
                    player.options.guildId
                  } | La cola ha terminado [${colors.blue("24/7 ENABLED")}]`
                );
              } else {
                client.warn(
                  `Algo inesperado sucedió con el reproductor ${player.options.guildId}`
                );
              }
              player.setNowplayingMessage(client, null);
            } catch (err) {
              client.error(err);
            }
          }
        }
      );
  }

  /**
   * Checks if a message has been deleted during the run time of the Bot
   * @param {Message} message
   * @returns
   */
  isMessageDeleted(message) {
    return this.deletedMessages.has(message);
  }

  /**
   * Marks (adds) a message on the client's `deletedMessages` WeakSet so it's
   * state can be seen through the code
   * @param {Message} message
   */
  markMessageAsDeleted(message) {
    this.deletedMessages.add(message);
  }

  /**
   *
   * @param {string} text
   * @returns {EmbedBuilder}
   */
  Embed(text) {
    let embed = new EmbedBuilder().setColor(this.config.embedColor);

    if (text) {
      embed.setDescription(text);
    }

    return embed;
  }

  /**
   *
   * @param {string} text
   * @returns {EmbedBuilder}
   */
  ErrorEmbed(text) {
    let embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setDescription("❌ | " + text);

    return embed;
  }

  LoadEvents() {
    let EventsDir = path.join(__dirname, "..", "events");
    fs.readdir(EventsDir, (err, files) => {
      if (err) {
        throw err;
      } else {
        files.forEach((file) => {
          const event = require(EventsDir + "/" + file);
          this.on(file.split(".")[0], event.bind(null, this));
          this.warn("Evento Cargado: " + file.split(".")[0]);
        });
      }
    });
  }

  LoadCommands() {
    let SlashCommandsDirectory = path.join(
      __dirname,
      "..",
      "commands",
      "slash"
    );
    fs.readdir(SlashCommandsDirectory, (err, files) => {
      if (err) {
        throw err;
      } else {
        files.forEach((file) => {
          let cmd = require(SlashCommandsDirectory + "/" + file);

          if (!cmd || !cmd.run) {
            return this.warn(
              "No se puede cargar el comando: " +
                file.split(".")[0] +
                ", El archivo no tiene un comando válido con la función de ejecución"
            );
          }
          this.slashCommands.set(file.split(".")[0].toLowerCase(), cmd);
          this.log("Comando Slash cargado: " + file.split(".")[0]);
        });
      }
    });

    let ContextCommandsDirectory = path.join(
      __dirname,
      "..",
      "commands",
      "context"
    );
    fs.readdir(ContextCommandsDirectory, (err, files) => {
      if (err) {
        throw err;
      } else {
        files.forEach((file) => {
          let cmd = require(ContextCommandsDirectory + "/" + file);
          if (!cmd.command || !cmd.run) {
            return this.warn(
              "No se puede cargar el comando: " +
                file.split(".")[0] +
                ", El archivo no tiene comando/ejecutar"
            );
          }
          this.contextCommands.set(file.split(".")[0].toLowerCase(), cmd);
          this.log("ContextMenu Cargado: " + file.split(".")[0]);
        });
      }
    });
  }

  /**
   *
   * @param {import("discord.js").TextChannel} textChannel
   * @param {import("discord.js").VoiceChannel} voiceChannel
   */
  createPlayer(textChannel, voiceChannel) {
    return this.manager.create({
      guildId: textChannel.guild.id,
      voiceChannelId: voiceChannel.id,
      textChannelId: textChannel.id,
      selfDeafen: this.config.serverDeafen,
      volume: this.config.defaultVolume,
    });
  }

  createController(guild, player) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setCustomId(`controller:${guild}:Stop`)
        .setEmoji("<:stop:1155957137961390171>"), //⏹️

      new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`controller:${guild}:Replay`)
        .setEmoji("<:atrasar:1155957356040036474>"), //⏮️

      new ButtonBuilder()
        .setStyle(player.playing ? ButtonStyle.Secondary : ButtonStyle.Success)
        .setCustomId(`controller:${guild}:PlayAndPause`)
        .setEmoji(player.playing ? "<:pausa:1155957136023638086>" : "<:play:1155959296195035156>"), //"⏸️" : "▶️"),

      new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`controller:${guild}:Next`)
        .setEmoji("<:adelantar:1155957355029200936>"), //⏭️

      new ButtonBuilder()
        .setStyle(
          player.trackRepeat
            ? ButtonStyle.Success
            : player.queueRepeat
            ? ButtonStyle.Success
            : ButtonStyle.Primary
        )
        .setCustomId(`controller:${guild}:Queue`)
        .setEmoji(player.trackRepeat ? "🔂" : player.queueRepeat ? "<:listas:1155957134891159663>" : "<:listas:1155957134891159663>")
    );
  }
}

module.exports = DiscordMusicBot;
