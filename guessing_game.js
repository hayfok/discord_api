
const fs = require('node:fs');
const path = require('node:path');
const { Client, Intents, REST, CommandInteraction } = require('discord.js');
require('dotenv').config();


const bot_token  = process.env.BOT_TOKEN;
const gpt_token = process.env.GPT_TOKEN;
const clientId = 'process.env.CLIENT_ID';


/* Static ID assignment per deployment, primarily for testing purposes */
const sql3_path = ''; // static path to the database location on disk
const sqlite3 = require(sql3_path);
const bot_channel = ''; // static channel ID of the discord channel the bot is in
const me = ''; // static id of a user for testing purposes

// Build client
const client = new Client({
        intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES],
        partials: ['MESSAGE', 'CHANNEL'],
});

// Log bot in
client.login(bot_token);
console.log("\n");

// Test client connectivity 
client.once('ready', bot => {
    console.log(`bot constructor network conn test for: ${bot.user.username} was successful ... \n`);
});


// Static path for the discord chat message archival 
const discordMessageArchivePath = '';
// This is a local database to log all discord messages in this channel.
let dbChat = new sqlite3.Database('discordMessageArchivePath', (err) => {
        if(err){
                console.log("database for chat logging ... was: ERR  -" + err.message);
        }
        else{
                console.log("database for chat logging ... was opened successfully \n");
        }
});


// Static path for the discord chat message archival
const tweetDatabasePath = '';
// This is a local database of tweet data I've scraped, the bot will use these to posts images or tweet text bodies. 
let dbTweet = new sqlite3.Database('tweetDatabasePath', (err) => {
    if(err){
            console.log("database for twitter data ... was: ERR -" + err.message);
    }
    else{
            console.log("database for twitter data ... was opened successfully \n");
    }
});


// static path to the bank database
const bankPath = '';
// This is a bank for a game I wrote
let dbBank = new sqlite3.Database('bankPath', (err) => {
    if(err){
        console.log('dbBank open error' + err.message)
    }
    else {
        console.log('dbBank opened successfully')
    }
});

/* selects one random video or photo from the database tweet-data */
client.once('ready', client => {

        /* lets get a random participant to make the select odds better as not everyone has the same amount of data in the database */
        let participants = [/* this is an array of players for this game, excluded for demonstration purposes */];
        let participant = participants[Math.floor(Math.random()* participants.length)];
        console.log(participant);

        /* lets select a random media type to get from the database */
        let media_types = ['photo', 'video/mp4'];
        let media = media_types[Math.floor(Math.random()*media_types.length)]

                // database dips -> photo branch
                if (media == 'photo'){
                         dbTweet.serialize(() => {
                                 dbTweet.get('SELECT * FROM tweet_data WHERE "media_type" = "photo" AND name = ? ORDER BY RANDOM() LIMIT 1', {1: participant}, (err, photoQuery)=> {
                                         if(photoQuery){
                                                client.channels.fetch(bot_channel).then((channel) => channel.send(` \`\`\`diff\n+ new game dropped \n you have 29 min \`\`\` \n ${photoQuery.media} `))
                                                // the 15 minute update revealing a hint (if one exists)
                                                setTimeout(() => {
                                                        if(photoQuery.text){
                                                                client.channels.fetch(bot_channel)
                                                                .then((channel) => channel.send(` \`\`\`diff\n+ halftime update!! ⇒ tweet body: \n {${photoQuery.text}}\`\`\` `))
                                                        }
                                                        else{
                                                                client.channels.fetch(bot_channel)
                                                                .then((channel) => channel.send(` \`\`\`diff\n+ halftime update!! \n {the tweet body was blank, hard mode enabled!!} \`\`\` `))
                                                        }
                                                }, 900000, photoQuery.text, client); // 15 min

                                                // the game over signal to kill the process
                                                setTimeout(() => {
                                                        client.channels.fetch(bot_channel)
                                                        .then((channel) => channel.send(`\`\`\`ini\n[the answer was ${photoQuery.name}\]\`\`\` `))
                                                        .then(() => {process.exit(1)})
                                                }, 1740000, photoQuery.name, client); // 29 min

                                                // log the database dip data, then run the game function
                                                log(photoQuery.name, photoQuery.media)
                                                game(photoQuery.name)

                                         // the database dip failed !!! there was either a blank entry or there was an error with the database call
                                         } else {
                                                 console.log("photo failed")
                                                 process.exit(1);
                                         }
                                         if (err) {
                                                 console.log(err)
                                         }
                               })
                        })
                }
                // database dips -> video branch
                if (media == 'video/mp4'){
                         dbTweet.serialize(() => {
                                 dbTweet.get('SELECT * FROM tweet_data WHERE "media_type" = "video/mp4" AND name = ? ORDER BY RANDOM() LIMIT 1', {1: participant}, (err, videoQuery)=> {
                                         if(videoQuery){
                                                client.channels.fetch(bot_channel).then((channel) => channel.send(`  \`\`\`diff\n+ new game dropped \n you have 29 min \`\`\` \n ${videoQuery.media}`))

                                                // the 15 minute update revealing a hint (if one exists)
                                                setTimeout(() => {
                                                        if(videoQuery.text){
                                                                client.channels.fetch(bot_channel)
                                                                .then((channel) => channel.send(` \`\`\`diff\n+ halftime update!! ⇒ tweet body: \n {${videoQuery.text}}\`\`\` `))
                                                        }
                                                        else{
                                                                client.channels.fetch(bot_channel)
                                                                .then((channel) => channel.send(` \`\`\`diff\n+ halftime update!! \n {the tweet body was blank, hard mode enabled!!} \`\`\` `))
                                                        }
                                                }, 900000, videoQuery.text, client); // 15 min

                                                // the game over signal to kill the process
                                                setTimeout(() => {
                                                client.channels.fetch(bot_channel)
                                                        .then((channel) => channel.send(`\`\`\`ini\n[the answer was ${videoQuery.name}\]\`\`\` `))
                                                        .then(() => {process.exit(1)})
                                                }, 1740000, videoQuery.name, client); // 29 min

                                                // log the database dip data, then run the game function
                                                log(videoQuery.name, videoQuery.media)
                                                game(videoQuery.name)

                                         // the database dip failed !!! there was either a blank entry or there was an error with the database call
                                         } else {
                                                 console.log("photo failed")
                                                 process.exit(1);
                                         }
                                         if (err) {
                                                 console.log(err)
                                         }
                               })
                        })
                }
});



/* this function is called in the client.once in either the photo or video branches */
function game(person){
        let arr = [];
        console.log(person);
        client.on(Events.MessageReactionAdd, async (reaction, user) => {
        if (reaction.message.author == bot){
            if (arr.includes(user.id)){
                return;
            } else {
                arr.push(user.id)
                console.log(`${user.username} already guessed, can't guess again... ${arr}`)
                if (person == reaction._emoji.name){
                    console.log("winner!!")

                    client.channels.fetch(bot_channel).then((channel) => channel.send(`\`\`\`yaml\n+${user.username} guessed "${person}" which is correct, awarding $10 -- this round is over\`\`\` `))
                    bankWinUpdate(user.id, user.username)
                } else {
                    console.log("you gussed incorrectly -- loser")

                    client.channels.fetch(bot_channel).then((channel) => channel.send(`\`\`\`diff\n\-${user.username} guessed ${reaction._emoji.name} which is incorrect, removing $2\`\`\` `))
                    bankLoseUpdate(user.id, user.username)
                }
            }

        // console.log(reaction._emoji.name)
            };
    });
};

/* the bank function to update the users money */
function bankWinUpdate(user, username){
                dbBank.serialize(() => {
                        dbBank.get('SELECT * FROM vault WHERE uid = ?', {1: user}, (err, res)=> {
                        if(res){
                            let sum = res.money + 10;
                                    dbBank.run('UPDATE vault SET money = ? WHERE uid = ?',{1: sum, 2: user}, (err)=> {
                                    });
                        }
                        if(res == undefined){
                            /* this entry didn't exist in the database, let's make one */
                            dbBank.run('INSERT INTO vault (uid, name, money) VALUES (?,?,?);', {1: user, 2: username, 3: 110}, (err) => {
                                if(err){console.log(err)};
                            });
                        };
                        if(err){console.log(err.message)}
                        });
                });
        setTimeout(() => {process.exit(1)}, 2000)
};
function bankLoseUpdate(user, username){
            dbBank.serialize(() => {
                dbBank.get('SELECT * FROM vault WHERE uid = ?', {1: user}, (err, res)=> {
                if(res){
                    let diff = res.money - 2;
                            dbBank.run('UPDATE vault SET money = ? WHERE uid = ?',{1: diff, 2: user}, (err)=> {
                            });
                }
                if(res == undefined){
                    /* this entry didn't exist in the database, let's make one */
                    dbBank.run('INSERT INTO vault (uid, name, money) VALUES (?,?,?)', {1: user, 2: username, 3: 98}, (err) => {
                        if(err){console.log(err)};
                    });
                };
                if(err){console.log(err.message)}
                });
        });
};




