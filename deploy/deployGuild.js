const readline = require("readline");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const getConfig = require("../util/getConfig");
const LoadCommands = require("../util/loadCommands");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

(async () => {
	const config = await getConfig();
	const rest = new REST({ version: "9" }).setToken(config.token);
	const commands = await LoadCommands().then((cmds) => {
		return [].concat(cmds.slash).concat(cmds.context);
	});
	
	rl.question(
		"Ingrese la ID del servidor en el que desea implementar los comandos: ",
		async (guild) => {
			console.log("Implementando comandos al servidor...");
			await rest
				.put(Routes.applicationGuildCommands(config.clientId, guild), {
					body: commands,
				})
				.catch(console.log);
			console.log("¡Comandos implementados con éxito!");
			rl.close();
		},
	);
})();
