/**
 *
 * @param {import("../lib/DiscordMusicBot")} client
 * @param {*} data
 */
module.exports = (client, data) => {
	if (client.manager) {
		client.manager.updateVoiceState(data);
	}
};
