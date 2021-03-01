const Discord = require('discord.js');
const ayarlar = require('../jsonlar/ayarlar.json');

var prefix = ayarlar.prefix;

module.exports = client => {
   client.user.setStatus('idle') 
var oyun = [
         `odies.net`
    ];

    setInterval(function() {

        var random = Math.floor(Math.random()*(oyun.length-0+1)+0);
        client.user.setActivity(oyun[random], {type: "WATCHING"});
      
        }, 10 * 1000);

};