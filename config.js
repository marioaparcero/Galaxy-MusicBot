const profiles = {
	lucio: {
		token: process.env.LUCIO_TOKEN || "", 
		clientId: process.env.LUCIO_CLIENT_ID || "",
		clientSecret: process.env.LUCIO_CLIENT_SECRET || "",
		iconURL: "https://comunidadoverwatch.com/wp-content/uploads/2023/09/lucio-disco1.gif",
		voiceStatusEmoji: "<:playblue:1520236100033970196>",
		port: 4200,
	},
	dva: {
		token: process.env.DVA_TOKEN || "",
		clientId: process.env.DVA_CLIENT_ID || "",
		clientSecret: process.env.DVA_CLIENT_SECRET || "",
		iconURL: "https://comunidadoverwatch.com/wp-content/uploads/2023/09/dva7.gif",
		voiceStatusEmoji: "<:playblue:1520236305882284235>",
		port: 4201,
	},
	jetpackcat: {
		token: process.env.JETPACKCAT_TOKEN || "",
		clientId: process.env.JETPACKCAT_CLIENT_ID || "",
		clientSecret: process.env.JETPACKCAT_CLIENT_SECRET || "",
		iconURL: "https://comunidadoverwatch.com/wp-content/uploads/2023/09/jetpackcat.gif",
		voiceStatusEmoji: "<:playblue:1520236437050495086>",
		port: 4202,
	}
};

// Lee la variable de entorno BOT_PROFILE (usada por PM2 o Docker), o usa "lucio" por defecto
const profileName = process.env.BOT_PROFILE || "lucio";
const activeProfile = profiles[profileName.toLowerCase()] || profiles.lucio;
// BOT_PROFILE=lucio pm2 start index.js --name "LucioBot"
// BOT_PROFILE=dva pm2 start index.js --name "DvaBot"
// BOT_PROFILE=jetpackcat pm2 start index.js --name "JetpackCatBot"

module.exports = {
	// ===============================
	// CONFIGURACIÓN ACTIVA DEL BOT
	// ===============================
	activeProfileName: profileName.toLowerCase(),
	token: activeProfile.token,
	clientId: activeProfile.clientId,
	clientSecret: activeProfile.clientSecret,
	iconURL: activeProfile.iconURL,
	voiceStatusEmoji: activeProfile.voiceStatusEmoji,
	port: activeProfile.port,

	// ===============================
	// CONFIGURACIÓN GENERAL
	// ===============================
	enableDashboard: false, //- Cambia esto a false si quieres desactivar el panel web para ahorrar RAM
	
	helpCmdPerPage: 10, //- Number of commands per page of help command
	lyricsMaxResults: 5, //- Number of results for lyrics command (Do not touch this value if you don't know what you are doing)
	adminId: "649094110300602408", //- Replace UserId with the Discord ID of the admin of the bot
	scopes: ["identify", "guilds", "applications.commands"], //- Discord OAuth2 Scopes
	inviteScopes: ["bot", "applications.commands"], // Invite link scopes
	serverDeafen: true, //- If you want bot to stay deafened
	defaultVolume: 100, //- Sets the default volume of the bot, You can change this number anywhere from 1 to 100
	supportServer: "https://discord.gg/sbySMS7m3v", //- Support Server Link
	Issues: "https://github.com/SudhanPlayz/Discord-MusicBot/issues", //- Bug Report Link
	permissions: 277083450689, //- Bot Inviting Permissions
	disconnectTime: 30000, //- How long should the bot wait before disconnecting from the voice channel (in miliseconds). Set to 1 for instant disconnect.
	twentyFourSeven: false, //- When set to true, the bot will never disconnect from the voice channel
	autoQueue: false, //- When set to true, related songs will automatically be added to the queue
	autoPause: true, //- When set to true, music will automatically be paused if everyone leaves the voice channel
	autoLeave: false, //- When set to true, the bot will automatically leave when no one is in the voice channel (can be combined with 24/7 to always be in voice channel until everyone leaves; if 24/7 is on disconnectTime will add a disconnect delay after everyone leaves.)
	debug: false, //- Debug mode
	cookieSecret: "CodingWithSudhan is epic", //- Cookie Secret
	website: "http://localhost:" + activeProfile.port, //- without the / at the end
	
	nodes: [
		{
			identifier: "Main Node", //- Used for indentifier in stats commands.
			host: "", //- The host name or IP of the lavalink server.
			port: 80, // The port that lavalink is listening to. This must be a number!
			password: "", //- The password of the lavalink server.
			retryAmount: 200, //- The amount of times to retry connecting to the node if connection got dropped.
			retryDelay: 40, //- Delay between reconnect attempts if connection is lost.
			secure: false, //- Can be either true or false. Only use true if ssl is enabled!
		},
	],
	embedColor: "#2f3136", //- Color of the embeds, hex supported
	presence: {
		status: "online", //- You can have online, idle, dnd and invisible (Note: invisible makes people think the bot is offline)
		activities: [
			{
				name: "Music", //- Status Text
				type: 2, //- PLAYING, WATCHING, LISTENING, STREAMING
			},
		],
	},
};
