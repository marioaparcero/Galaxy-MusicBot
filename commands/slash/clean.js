const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand()
	.setName("clean")
	.setNameLocalizations({
		'es-ES': 'limpiar',
	})
	.setDescription("Cleans the last 100 bot messages from channel.")
	.setDescriptionLocalizations({
		'es-ES': 'Limpia los últimos 100 mensajes de bot del canal.',
	})
	.addIntegerOption((option) =>
		option
			.setName("number")
			.setNameLocalizations({
				'es-ES': 'número',
			})
			.setDescription("Number of messages to delete.")
			.setDescriptionLocalizations({
				'es-ES': 'Número de mensajes a eliminar.',
			})
			.setMinValue(2).setMaxValue(100)
			.setRequired(false),
	)
	.setRun(async (client, interaction, options) => {
		
		await interaction.deferReply();
		let number = interaction.options.getInteger("number");
		number = number && number < 100? ++number : 100;
		
		
		interaction.channel.messages.fetch({
			limit: number,
		}).then((messages) => {
			const botMessages = [];
			messages.filter(m => m.author.id === client.user.id).forEach(msg => botMessages.push(msg))
			
			botMessages.shift();
			interaction.channel.bulkDelete(botMessages, true)
				.then(async deletedMessages => {
					//Filtering out messages that did not get deleted.
					messages = messages.filter(msg => {
						!deletedMessages.some(deletedMsg => deletedMsg == msg);
					});
					if (messages.size > 0) {
						client.log(`Deleting [${ messages.size }] messages older than 14 days.`)
						for (const msg of messages) {
							await msg.delete();
						}
					}
					
					await interaction.editReply({ embeds: [client.Embed(`:white_check_mark: | Deleted ${ botMessages.length } bot messages`)] });
					setTimeout(() => {
						interaction.deleteReply();
					}, 5000);
				})
			
		});
	})

module.exports = command;
