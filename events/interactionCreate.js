const Controller = require("../util/Controller");
const yt = require("youtube-sr").default;

function normalizeYoutubeQuery(query) {
    const trimmed = (query ?? "").trim();
    if (!trimmed) return trimmed;

    try {
        const parsed = new URL(trimmed);
        const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
        const isYouTubeHost = ["youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be", "youtube-nocookie.com"].includes(hostname);

        if (!isYouTubeHost) return trimmed;

        const listId = parsed.searchParams.get("list");
        const videoId = parsed.searchParams.get("v");

        if (videoId && (parsed.pathname === "/watch" || listId)) {
            const sanitized = new URL("https://www.youtube.com/watch");
            sanitized.searchParams.set("v", videoId);
            if (listId) {
                sanitized.searchParams.set("list", listId);
            }
            return sanitized.toString();
        }

        if (listId && (parsed.pathname === "/playlist" || parsed.pathname.startsWith("/playlist/"))) {
            return `https://www.youtube.com/playlist?list=${listId}`;
        }

        if (hostname === "youtu.be") {
            const shortVideoId = parsed.pathname.replace(/^\/+/, "");
            if (shortVideoId) return `https://www.youtube.com/watch?v=${shortVideoId}`;
        }
    } catch (_) {
        // Ignorar URLs no válidas y mantener la consulta original.
    }

    return trimmed;
}

async function getAutocompleteChoices(query) {
    const rawQuery = normalizeYoutubeQuery(query ?? "");
    if (!rawQuery) return [];

    const directUrl = [
        /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/,
        /^(?:spotify:|https:\/\/[a-z]+\.spotify\.com\/(track\/|user\/(.*)\/playlist\/|playlist\/))(.*)$/,
        /^https?:\/\/(?:www\.)?deezer\.com\/[a-z]+\/(track|album|playlist)\/(\d+)$/,
        /^(?:(https?):\/\/)?(?:(?:www|m)\.)?(soundcloud\.com|snd\.sc)\/(.*)$/,
        /(?:https:\/\/music\.apple\.com\/)(?:.+)?(artist|album|music-video|playlist)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)\/([\w\-\.]+(\/)+[\w\-\.]+|[^&]+)/
    ].some((regex) => regex.test(rawQuery));

    if (directUrl) {
        return [{ name: rawQuery, value: rawQuery }];
    }

    const fallbackQueries = new Set([rawQuery]);
    const normalized = rawQuery.replace(/\s+/g, " ").trim();
    const shortKeywords = ["song", "music", "video", "official", "lyrics"];

    if (normalized.length <= 5) {
        shortKeywords.forEach((keyword) => fallbackQueries.add(`${normalized} ${keyword}`));
    }

    const choices = [];
    const seenValues = new Set();

    for (const searchQuery of fallbackQueries) {
        let results = [];
        try {
            results = await yt.search(searchQuery, { safeSearch: false, limit: 12 });
        } catch (_) {
            continue;
        }

        for (const item of results || []) {
            if (!item || !item.title || !item.url) continue;
            if (seenValues.has(item.url)) continue;

            const name = item.title.length > 100 ? `${item.title.slice(0, 97)}...` : item.title;
            choices.push({ name, value: item.url });
            seenValues.add(item.url);

            if (choices.length >= 10) break;
        }

        if (choices.length >= 10) break;
    }

    return choices;
}

/**
 *
 * @param {import("../lib/DiscordMusicBot")} client
 * @param {import("discord.js").Interaction}interaction
 */
module.exports = async (client, interaction) => {
    if (interaction.isChatInputCommand()) {
        let command = client.slashCommands.find(
            (x) => x.name == interaction.commandName,
        );
        if (!command || !command.run) {
            return interaction.reply(
                "Sorry the command you used doesn't have any run function",
            );
        }
        client.commandsRan++;
        command.run(client, interaction, interaction.options);
        return;
    }

    if (interaction.isContextMenuCommand()) {
        let command = client.contextCommands.find(
            (x) => x.command.name == interaction.commandName,
        );
        if (!command || !command.run) {
            return interaction.reply(
                "Sorry the command you used doesn't have any run function",
            );
        }
        client.commandsRan++;
        command.run(client, interaction, interaction.options);
        return;
    }

    if (interaction.isButton()) {
        if (interaction.customId.startsWith("controller")) {
            Controller(client, interaction);
        }
    }

    if (interaction.isAutocomplete()) {
        const url = interaction.options.getString("query") ?? "";
        if (!url.trim()) return;

        if (interaction.commandName == "play") {
            const choice = await getAutocompleteChoices(url);
            return await interaction.respond(choice).catch(() => { });
        }
    }
};
