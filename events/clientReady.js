/**
 *
 * @param {import("../lib/DiscordMusicBot")} client
 */
module.exports = (client) => {
	if (client.manager) {
		client.manager.init({ clientId: client.user.id });
	}
	client.user.setPresence(client.config.presence);
	client.log("Conectado como " + client.user.tag); //Successfully! Logged in as
};
