console.clear();

const Discord = require("discord.js");
const Config = require("./config/mainConfig.json");
const Token = require("./config/token.json").token;

const bot = new Discord.Client();
bot.login(Token);

bot.on("ready", () => {
    console.log(bot.user.tag + " logged on successfully.")
});

bot.on("voiceStateUpdate", (oldMem, newMem) => {
    let newChan = newMem.voiceChannel
    let oldChan = oldMem.voiceChannel

    if (!newMem.manageable) { console.log("Higher role"); return 0; }
    if (oldChan === undefined && newChan !== undefined) { 
        newMem.addRole(Config.inVCRole, "User joined a voice channel.")
    } else if(newChan === undefined) {
        newMem.removeRole(Config.inVCRole, "User left a voice channel.")
    }
})

bot.on('message',(message) => {
    if (message.author.bot) return

    var args = message.content.trim().split(" ");
    const command = args.shift().toLowerCase();

    if (command == Config.prefix + "ping") {
        message.reply(`Pong! ${bot.ping}ms`)
    }
})