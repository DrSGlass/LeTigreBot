console.clear();

const Discord = require("discord.js");
const roblox = require('roblox-js')
const TrelloModule = require('trello')
const Config = require("./config/Config.json");
const sConfig = require("./config/sConfig.json");
const fs = require("fs");
const dateFormat = require('dateformat');
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
const Token = sConfig.token;

const Trello = new TrelloModule(sConfig.trelloApplicationKey,sConfig.trelloUserToken)
const bot = new Discord.Client();
bot.login(Token);

bot.on("ready", () => {
    console.log(bot.user.tag + " logged on successfully.")
});

var updateRoles = (member,rank,role) => {

}

var reports = {}

bot.on('guildMemberAdd',async (member) => {
    var guild = bot.guilds.get('524452811988140032')
    if (member.guild == guild) {
        await member.addRole(guild.roles.find('name',member.id))
        if (reports[member.id]) {
            var channel = guild.channels.get(reports[member.id])
            setTimeout(function() {
                channel.send(`<@${member.id}> This is your private channel.  Only you and the executives can read this.  Anything you'd like to inform Le Tigre executives please post here.  Pictures and/or video are welcome.  <@&524453329204543488>`)
            },2000)
        }
    }
})

bot.on('guildMemberRemove',async (member) => {
    var guild = bot.guilds.get('524452811988140032')
    if (member.guild == guild) {
        await guild.roles.find('name',member.id).delete()
        await guild.channels.get(reports[member.id]).delete()
        reports[member.id] = undefined
    }
})

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

    var speakerId = await roblox.getIdFromUsername(message.member.displayName)
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
        if (speakerRank < 245) {message.channel.send("You do not have permission to rank users.").then(m => {m.delete(5000); message.delete(5000)}); return}
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
					if(speakerRank <= parseInt(args[0])){
						m.edit(`You can not rank ${username} to that.`)
					} else {
						m.edit(`${id} is rank ${rank} and can be ranked.`)
						roblox.setRank(Config.groupId, id,parseInt(args.shift()))
						.then(function(newRole){
                            m.edit(`Ranked to ${newRole.Name}`)
                            var reason = args.join(" ")
                            if (reason == "" || reason == " ") reason = "No reason provided"
                            bot.channels.get('524308609329397801').send(new Discord.RichEmbed()
                            .setAuthor("Rank Log",message.author.displayAvatarURL)
                            .setDescription("User rank changed")
                            .addField("User",username,true)
                            .addField("New Rank",newRole.Name,true)
                            .addField("Speaker",message.member.displayName,true)
                            .addField("Reason",reason,true)
                            .setTimestamp(getCurrentTime()))
                            var u = message.guild.members.find(subject => subject.displayName.toLowerCase() == username.toLowerCase())
                            if (u) {
                                u.user.send(new Discord.RichEmbed()
                                .setTitle("Le Tigre Bleu Theatre")
                                .setColor("BLUE")
                                .setDescription(`Your rank in Le Tigre Bleu Theatre has been changed to **${newRole.Name}**.  The reason provided is **${reason}**.\n\nIf you feel the rank change was unfair and would like to appeal, please bring it up to Le Tigre executives by using the **!request** command in <#506586162153127974>.`)
                                .setTimestamp(getCurrentTime())
                                .setFooter("Le Tigre Bleu Theatre"))
                            }
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
				m.edit(`${username} is not a valid account name.`)
			});
    	} else {
    		message.channel.send("Please enter a username.")
    	}
    	return;
    }

    if (command === Config.prefix + "shout") {
        if (speakerRank < 245) {message.channel.send("You do not have permission to shout.").then(m => {m.delete(5000); message.delete(5000)}); return}
        if (message.channel.id != '524308609329397801') {message.channel.send("Please use the shout command in <#524308609329397801>.").then(m => {m.delete(5000); message.delete(5000)}); return}
        if (!args) {
            message.reply('Please specify a message to shout.')
            return
        }
        const shoutMSG = args.join(" ");

        roblox.shout(Config.groupId, shoutMSG)
            .then(function() {
                console.log(`Shouted ${shoutMSG}`);
                message.channel.send('Shouted to the group!').then(m => {m.delete(5000); message.delete(5000)})
                bot.channels.get('524308609329397801').send(new Discord.RichEmbed()
                    .setAuthor("Shout Log",message.author.displayAvatarURL)
                    .setDescription(message.member.displayName)
                    .addField("Message",shoutMSG,true)
                    .setTimestamp(getCurrentTime()))
            })
            .catch(function(error) {
                console.log(`Shout error: ${error}`)
            });
    }

    if (command === Config.prefix + "request") {
        var guild = bot.guilds.get('524452811988140032')
        if (guild.roles.find('name',message.author.id)) {
            var rip = await message.channel.send("You already have a request channel opened.")
            rip.delete(5000);
            message.delete(5000);
            return
        }
        if (guild.members.get(message.author.id) && guild.members.get(message.author.id).roles.find('name','Staff')) {message.delete(); return}
        var status = await message.channel.send(`<@${message.author.id}> Please wait...`)
        var channel = await guild.createChannel(message.member.displayName,"text")
        channel.setParent('524453053664067584')
        channel.overwritePermissions(guild.roles.find('name','@everyone'),{"READ_MESSAGES":false})
        var role = await guild.createRole({name:message.author.id,color:"RED"})
        channel.overwritePermissions(role,{"READ_MESSAGES":true})
        channel.overwritePermissions('524453329204543488',{"READ_MESSAGES":true})
        var invite = await channel.createInvite({
            'unique':true,
            'maxUses':1,
            'maxAge':0,
        })
        reports[message.author.id] = channel.id
        message.author.send("Please join this server.  You will be given a role which will give you access to a channel between you and our executives.  http://discord.gg/" + invite.code).then(dmMessage => {status.edit("Check your DM!")})
    }
})
