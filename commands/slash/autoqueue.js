const colors = require("colors");
const { MessageEmbed } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand()
	.setName("autoqueue")
	.setNameLocalizations({
		'es-ES': 'autocola',
	})
	.setDescription("Automatically add songs to the queue (toggle)")
	.setDescriptionLocalizations({
		'es-ES': 'Agregar canciones automáticamente a la cola (alternar)',
  	})
	.setRun(async (client, interaction) => {
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
						.setDescription("No hay nada reproduciéndose en la cola"),
				],
				ephemeral: true,
			});
		}
		
		let autoQueueEmbed = new MessageEmbed().setColor(client.config.embedColor);
		const autoQueue = player.get("autoQueue");
		player.set("requester", interaction.guild.members.me);
		
		if (!autoQueue || autoQueue === false) {
			player.set("autoQueue", true);
		} else {
			player.set("autoQueue", false);
		}
		autoQueueEmbed
		  .setDescription(`**La cola automática está** \`${!autoQueue ? "Encendida" : "Apagada"}\``)
		  .setFooter({
		    text: `La música relacionada ${!autoQueue ? "ahora" : "ya no"} se agregará automáticamente a la cola.`
      });
		client.warn(
			`Reproductor: ${ player.options.guild } | [${ colors.blue(
				"AUTOQUEUE",
			) }] ha sido [${ colors.blue(!autoQueue? "ENABLED" : "DISABLED") }] in ${
				client.guilds.cache.get(player.options.guild)
					? client.guilds.cache.get(player.options.guild).name
					: "un servidor"
			}`,
		);
		
		return interaction.reply({ embeds: [autoQueueEmbed] });
	});

module.exports = command;
