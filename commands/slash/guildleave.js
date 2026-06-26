const { EmbedBuilder, message } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");
const fs = require("fs");
const path = require("path");
const { forEach } = require("lodash");

const command = new SlashCommand()
	.setName("guildleave")
	.setNameLocalizations({
		'es-ES': 'dejarservidor',
	})
	.setDescription("Leaves a guild")
	.setDescriptionLocalizations({
		'es-ES': 'Deja un servidor',
  	})
    .addStringOption((option) =>
    option
      .setName("id")
      .setDescription("Enter the guild id to leave (type `list` for guild ids)")
	  .setDescriptionLocalizations({
		'es-ES': 'Ingrese la identificación del servidor para salir (escriba `list` para identificar del servidor)',
		})
      .setRequired(true)
  )
  .setRun(async (client, interaction, options) => {
		if (interaction.user.id === client.config.adminId) {
		    try{
			const id = interaction.options.getString('id');

			if (id.toLowerCase() === 'list'){
			    client.guilds.cache.forEach((guild) => {
				console.log(`${guild.name} | ${guild.id}`);
			    });
			    const guild = client.guilds.cache.map(guild => ` ${guild.name} | ${guild.id}`);
			    try{
				return interaction.reply({content:`Guilds:\n\`${guild}\``, flags: 64});
			    }catch{
				return interaction.reply({content:`check console for list of guilds`, flags: 64});
			    }
			}

			const guild = client.guilds.cache.get(id);

			if(!guild){
			    return interaction.reply({content: `\`${id}\` is not a valid guild id`, flags: 64});
			}

			await guild.leave().then(c => console.log(`left guild ${id}`)).catch((err) => {console.log(err)});
			return interaction.reply({content:`left guild \`${id}\``, flags: 64});
		    }catch (error){
			console.log(`there was an error trying to leave guild ${id}`, error);
		    }
		}else {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(client.config.embedColor)
						.setDescription("¡No estás autorizado a utilizar este comando!"),
				],
				flags: 64,
			});
		}
	});

module.exports = command;
