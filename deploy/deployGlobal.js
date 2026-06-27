const { REST } = require("discord.js");
const { Routes } = require("discord-api-types/v9");
const getConfig = require("../util/getConfig");
const LoadCommands = require("../util/loadCommands");

(async () => {
	const config = await getConfig();
	const rest = new REST({ version: "9" }).setToken(config.token);
	const commands = await LoadCommands().then((cmds) => {
		return [].concat(cmds.slash).concat(cmds.context);
	});
	
	console.log(`Implementando comandos globales para el bot: ${config.activeProfileName}...`);
	await rest
		.put(Routes.applicationCommands(config.clientId), {
			body: commands,
		})
		.catch(console.log);
	console.log("¡Comandos globales implementados con éxito! (Nota: Pueden tardar hasta 1 hora en propagarse en Discord)");
})();
