console.clear();

const Discord = require("discord.js");
var roblox = require('roblox-js')
const TrelloModule = require('trello')
const Config = require("./config/Config.json");
const sConfig = require("./config/sConfig.json");
const fs = require("fs");
const dateFormat = require('dateformat');
const Token = sConfig.token;

const Trello = new TrelloModule(sConfig.trelloApplicationKey,sConfig.trelloUserToken)
const bot = new Discord.Client();
bot.login(Token);

bot.on("ready", () => {
    console.log(bot.user.tag + " logged on successfully.")
});

bot.on("voiceStateUpdate", (oldMem, newMem) => {
    if (newMem.user.bot) return 
    let newChan = newMem.voiceChannel
    let oldChan = oldMem.voiceChannel

    /*if (!newMem.manageable) { console.log("Higher role"); return 0; }*/
    if (oldChan === undefined && newChan !== undefined) { 
        newMem.addRole(Config.inVCRole, "User joined a voice channel.")
    } else if(newChan === undefined) {
        newMem.removeRole(Config.inVCRole, "User left a voice channel.")
    }
})

roblox.login({username: sConfig.username, password: sConfig.password}).then((success) => {

}).catch(() => {console.log("Failed to login.");});

function getCurrentTime() {
	var currentTime = new Date()
    return dateFormat(currentTime,"isoDateTime")
}

bot.on('message',async (message) => {
    if (message.author.bot) return

    var args = message.content.trim().split(" ");
    var command = args.shift().toLowerCase();

    var speakerId = await roblox.getIdFromUsername(message.member.nickname)
    var speakerRank = await roblox.getRankInGroup(Config.groupId,speakerId)

    if (command == Config.prefix + "ping") {
        message.reply(`Pong! ${bot.ping}ms`)
    }

    if (command === ">eval") {
        if (!(message.author.id == '189495219383697409' || message.author.id == '282639975013679114')) {
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

    if (command === Config.prefix + "events") {
        //console.log("Hello!")
        var p = Trello.getCardsForList('5bda01c787016f895ed6b10f')
        
        p.then((info) => {
            var msg = "Planned Events:\n"
            var ii = 1
            for (var i in info) {
                var data = info[i]
                if (data && data.labels.find(element => element.name == "Pending") && data.labels.find(element => element.name == "Approved")) {
                    console.log(data.name)
                    msg = msg + `${ii}. **${data.name}**\n`
                    ii++
                }
            }
            if (msg == "Planned Events:\n") msg = "No planned events."
            message.channel.send(msg)
        })

    }

    if (command === Config.prefix + "rank") {
        if (speakerRank < 248) {message.channel.send("You do not have permission to rank users.").then(m => {m.delete(5000); message.delete(5000)}); return}
        if (message.channel.id != '524308609329397801') {message.channel.send("Please use the rank command in <#524308609329397801>.").then(m => {m.delete(5000); message.delete(5000)}); return}
    	var username = args.shift()
    	if (username){
            var m = await message.channel.send(`Checking Roblox for ${username}`)
            message.delete(20000)
            m.delete(20000)
    		roblox.getIdFromUsername(username)
			.then(function(id){
				roblox.getRankInGroup(Config.groupId, id)
				.then(function(rank){
					if(Config.maximumRank <= rank){
						m.edit(`${id} is rank ${rank} and cannot be ranked.`)
					} else {
						m.edit(`${id} is rank ${rank} and can be ranked.`)
						roblox.setRank(Config.groupId, id,parseInt(args.shift()))
						.then(function(newRole){
                            m.edit(`Ranked to ${newRole.Name}`)
                            var reason = args.join(" ")
                            if (reason == "" || reason == " ") reason = "No reason provided"
                            bot.channels.get('524308609329397801').send(new Discord.RichEmbed()
                            .setTitle("Log")
                            .setDescription("User rank changed")
                            .addField("User",username,true)
                            .addField("New Rank",newRole.Name,true)
                            .addField("Speaker",message.member.displayName,true)
                            .addField("Reason",reason,true))
						}).catch(function(err){
                            m.edit("Failed to rank.")
                            console.log(err)
						});
					}
				}).catch(function(err){
                    console.log(err)
					m.edit(`Couldn't get ${username} in the group ${Config.groupId}.`)
				});
			}).catch(function(err){ 
                console.log(err)
				m.edit(`Sorry, but ${username} doesn't exist on ROBLOX.`)
			});
    	} else {
    		message.channel.send("Please enter a username.")
    	}
    	return;
    }
})
