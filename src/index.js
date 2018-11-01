console.clear();

const Discord = require("discord.js");
const TrelloModule = require('trello')
const Config = require("./config/mainConfig.json");
const sConfig = require("./config/sConfig.json");
const fs = require("fs");
const Token = sConfig.token;

const Trello = new TrelloModule(sConfig.trelloApplicationKey,sConfig.trelloUserToken)
const bot = new Discord.Client();
bot.login(Token);

bot.on("ready", () => {
    console.log(bot.user.tag + " logged on successfully.")
});

bot.on("voiceStateUpdate", (oldMem, newMem) => {
    let newChan = newMem.voiceChannel
    let oldChan = oldMem.voiceChannel

    /*if (!newMem.manageable) { console.log("Higher role"); return 0; }*/
    if (oldChan === undefined && newChan !== undefined) { 
        newMem.addRole(Config.inVCRole, "User joined a voice channel.")
    } else if(newChan === undefined) {
        newMem.removeRole(Config.inVCRole, "User left a voice channel.")
    }
})

bot.on('guildMemberAdd', async member => {
    var dmChannel = await member.createDM()
    dmChannel.send(`Welcome to Le Tigre Bleu Theatre discord's server, **${member.user.username}**!  Please take your time to verify by heading to <https://verify.eryn.io/>, if you have not already.  After you verify, your roles will be synced with the server and you can begin chatting.\n\nThanks!\n-Le Tigre Executives`)
})

bot.on('message',(message) => {
    if (message.author.bot) return

    var args = message.content.trim().split(" ");
    const command = args.shift().toLowerCase();

    if (command == Config.prefix + "ping") {
        message.reply(`Pong! ${bot.ping}ms`)
    }

    if (command === ">eval") {
        if (message.author.id !== '189495219383697409') {
            message.channel.send("<@" + message.author.id + "> You are not authorized to use that command.").then(newMessage => {newMessage.delete(5000); message.delete(5000);})
        }
        else {
            message.channel.send("Executing...").then(msg => {
                try {
                    eval(args.join(" "))
                }
                catch (err) {
                    message.channel.send("An error occurred!").then(mss => {mss.delete(2000)})
                    message.author.createDM().then(dmChannel => {
                        dmChannel.send(err)
                    })
                    console.error(err)
                }
                msg.delete()
                message.delete()
            })
        }
    }
})