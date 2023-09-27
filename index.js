//JotaroKujo0525 note, this is a deed that i should've done a long time ago
// Comandos para ejecutar el bot
//pm2 start java -- -jar Lavalink.jar
//pm2 start java --name "Lavalink Proceso" --interpreter none -- arg "-jar" "Lavalink.jar"
//if you wanna limit it to only using X amount of ram you can do java -XmxXG -jar Lavalink.jar I.e. java -Xmx2G -jar Lavalink.jar
//npm i
//npm run deploy
//node .

require('dotenv').config()

const DiscordMusicBot = require("./lib/DiscordMusicBot");
const { exec } = require("child_process");

if (process.env.REPL_ID) {
	console.log("Sistema Replit detectado, iniciando evento listener especial `unhandledRejection`.")
	process.on('unhandledRejection', (reason, promise) => {
		promise.catch((err) => {
			if (err.status === 429) {
				console.log("algo salió mal al intentar conectarse a la puerta de enlace de Discord, reiniciando...");
				exec("kill 1");
			}
		});
	});
}

const client = new DiscordMusicBot();

console.log("Asegúrese de completar config.js antes de iniciar el bot.");

const getClient = () => client;

module.exports = {
	getClient,
};
