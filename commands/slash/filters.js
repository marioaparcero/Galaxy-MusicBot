const { MessageEmbed } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand()
	.setName("filters")
	.setNameLocalizations({
		'es-ES': 'filtros',
	})
	.setDescription("add or remove filters")
	.setDescriptionLocalizations({
		'es-ES': 'agregar o quitar filtros',
  	})
	.addStringOption((option) =>
		option
			.setName("preset")
			.setDescription("the preset to add")
			.setDescriptionLocalizations({
				'es-ES': 'el preset para agregar',
			})
			.setRequired(true)
			.addChoices(
				{ name: "Nightcore", value: "nightcore" },
				{ name: "BassBoost", value: "bassboost" },
				{ name: "Vaporwave", value: "vaporwave" },
				{ name: "Pop", value: "pop" },
				{ name: "Soft", value: "soft" },
				{ name: "Treblebass", value: "treblebass" },
				{ name: "Eight Dimension", value: "eightD" },
				{ name: "Karaoke", value: "karaoke" },
				{ name: "Vibrato", value: "vibrato" },
				{ name: "Tremolo", value: "tremolo" },
				{ name: "Reset", value: "off" },
			),
	)
	
	.setRun(async (client, interaction, options) => {
		const args = interaction.options.getString("preset");
		
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
						.setDescription("No se está reproduciendo música."),
				],
				ephemeral: true,
			});
		}
		
		// create a new embed
		let filtersEmbed = new MessageEmbed().setColor(client.config.embedColor);
		
		if (args == "nightcore") {
			filtersEmbed.setDescription("✅ | ¡El filtro Nigthcore ya está activado!");
			player.nightcore = true;
		} else if (args == "bassboost") {
			filtersEmbed.setDescription("✅ | ¡El filtro BassBoost ya está activado!");
			player.bassboost = true;
		} else if (args == "vaporwave") {
			filtersEmbed.setDescription("✅ | ¡El filtro Vaporwave ya está activado!");
			player.vaporwave = true;
		} else if (args == "pop") {
			filtersEmbed.setDescription("✅ | ¡El filtro Pop ya está activado!");
			player.pop = true;
		} else if (args == "soft") {
			filtersEmbed.setDescription("✅ | ¡El filtro Soft ya está activado!");
			player.soft = true;
		} else if (args == "treblebass") {
			filtersEmbed.setDescription("✅ | ¡El filtro Treblebass ya está activado!");
			player.treblebass = true;
		} else if (args == "eightD") {
			filtersEmbed.setDescription("✅ | ¡El filtro Eight Dimension ya está activado!");
			player.eightD = true;
		} else if (args == "karaoke") {
			filtersEmbed.setDescription("✅ | ¡El filtro Karaoke ya está activado!");
			player.karaoke = true;
		} else if (args == "vibrato") {
			filtersEmbed.setDescription("✅ | ¡El filtro Vibrato ya está activado!");
			player.vibrato = true;
		} else if (args == "tremolo") {
			filtersEmbed.setDescription("✅ | ¡El filtro Tremolo ya está activado!");
			player.tremolo = true;
		} else if (args == "off") {
			filtersEmbed.setDescription("✅ | ¡EQ ha sido limpiado!");
			player.reset();
		} else {
			filtersEmbed.setDescription("❌ | ¡Filtro inválido!");
		}
		
		return interaction.reply({ embeds: [filtersEmbed] });
	});

module.exports = command;
