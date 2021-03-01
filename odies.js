"use strict"
const fs = require('fs');
const ayarlar = require('./jsonlar/ayarlar.json');
const replaceOnce = require('replace-once')
const Discord = require('discord.js');
const db = require('quick.db')
const client = new Discord.Client();
const log = message => {
  console.log(` ${message}`);
};
require('./util/eventLoader.js')(client);

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir('./komutlar/', (err, files) => {
    if (err) console.error(err);
    log(`${files.length} komut yüklenecek.`);
    files.forEach(f => {
        let props = require(`./komutlar/${f}`);
        log(`Yüklenen komut: ${props.help.name}.`);
        client.commands.set(props.help.name, props);
        props.conf.aliases.forEach(alias => {
            client.aliases.set(alias, props.help.name);
        });
    });
});

client.emojiler = {
    // KULLANIMI `${client.emojis.get(client.emojiler.tik)}`
    
    // GENEL EMOJİLER //
    tik: "774039712679198722", //Tik işareti
    x: "774006790282674198", //Çarpı işareti
    acik : "776854174842880030", //Açık Switch
    kapali: "776854174649811006", //Kapalı Switch
    uyari: "757249135987392533", //Uyarı - Ünlem
    
    // ROZET EMOJİLERİ //
    rozet1: "777533212472901662", //Sahip 
    rozet2: "777533212511436851", // Geliştirici 
    rozet3: "777533212665839636", // Özel Üye 
    rozet4: "777533212536733727", //Destekçi 
    rozet5: "777533212557180948", // Oy veren 
}

client.on("message", async(message) => {
    if (message.author.bot) return;

    let { status, ranks, logChannel, logRewardMessage, logUpMessage, blockChannels, blockRoles, reqXp } = await db.fetch(`levelSystem_${message.guild.id}`) || { status: false, reqXp: 3 };
    if (!reqXp) reqXp = 50;

    if (status) {

        if (blockChannels && blockChannels.includes(message.channel.id)) return;
        if (blockRoles && message.member.roles.cache.find(r => blockRoles.includes(r.id))) return;

        const { level, xp } = db.add(`levelProfile_${message.guild.id}_${message.author.id}.xp`, ((parseInt(message.content.length / 10, 10) + 1) * 10).toString().charAt(0));

        if (xp >= reqXp) {
  
            db.set(`levelProfile_${message.guild.id}_${message.author.id}.xp`, 0);
            
            const { level, xp } = db.add(`levelProfile_${message.guild.id}_${message.author.id}.level`, +1);
            logChannel = logChannel ? message.guild.channels.cache.get(logChannel) : message.channel;

            if (!logUpMessage) logUpMessage = "seviye atladın yeni seviyen {level}";

            await logChannel.send(replaceOnce(logUpMessage, ["{user}", "{level}"], [message.member, level]));

            const data = ranks ? ranks.find(x => x.level === `${level}`) : null;

            if (data) {

                if (!logRewardMessage) logRewardMessage = "seviye atladın ve yeni seviyen {level} aldığın seviye rolü {roleName}";

                try {

                    await message.member.roles.add(data.roleId);
                    await logChannel.send(replaceOnce(logRewardMessage, ["{user}", "{level}", "{roleName}"], [message.member, level, message.guild.roles.cache.get(data.roleId).name]));

                } catch (err) {
                    await message.guild.owner.send(`${data.roleId}'ıd li rol olmadığı için ${message.member} adlı kişiye rolü veremedim.`);
                }
            }
        }
    }
});

client.reload = command => {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(`./komutlar/${command}`)];
            let cmd = require(`./komutlar/${command}`);
            client.commands.delete(command);
            client.aliases.forEach((cmd, alias) => {
                if (cmd === command) client.aliases.delete(alias);
            });
            client.commands.set(command, cmd);
            cmd.conf.aliases.forEach(alias => {
                client.aliases.set(alias, cmd.help.name);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

client.load = command => {
    return new Promise((resolve, reject) => {
        try {
            let cmd = require(`./komutlar/${command}`);
            client.commands.set(command, cmd);
            cmd.conf.aliases.forEach(alias => {
                client.aliases.set(alias, cmd.help.name);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};


client.unload = command => {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(`./komutlar/${command}`)];
            let cmd = require(`./komutlar/${command}`);
            client.commands.delete(command);
            client.aliases.forEach((cmd, alias) => {
                if (cmd === command) client.aliases.delete(alias);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

client.elevation = message => {
    if (!message.guild) {
        return;
    }
    let permlvl = 0;
    if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
    if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
    if (message.author.id === ayarlar.sahip) permlvl = 4;
    return permlvl;
};
client.login(ayarlar.token)
