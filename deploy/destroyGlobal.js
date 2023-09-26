const { Client, Intents } = require("discord.js");
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});
const config = require("../config");

client.login(config.token);

client.on("ready", async () => {
  const commands = await client.application.commands.fetch();

  if (commands.size === 0) {
    console.log("No se pudo encontrar ningún comando global.");
    process.exit();
  }

  let deletedCount = 0;

  commands.forEach(async (command) => {
    await client.application.commands.delete(command.id);
    console.log(`Comando Slash con ID ${command.id} ha sido eliminado.`);
    deletedCount++;

    if (deletedCount === commands.size) {
      console.log(`Se eliminaron con éxito todos los comandos de barra global.`);
      process.exit();
    }
  });
});
