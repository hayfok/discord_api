const fs = require('node:fs');
const path = require('node:path');
const { Client, Intents, REST, CommandInteraction } = require('discord.js');
const axios = require('axios');
const { SlashCommandBuilder } = require('@discordjs/builders');
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

// Listen for incoming messages
client.on('messageCreate', (message) => {
        if (message.channel.id === bot_channel){
            try {
                if (message.author.bot) return; // stop the bot from responding to itself
                const msgAuthor = message.author.username;
                const msgAuthorId = message.author.id;
                const msgTimestamp = message.createdTimestamp;
                console.log(`${msgAuthor} said ${message} in the general chat \n`);
                dbChatWrite(msgAuthor, msgAuthorId, message, msgTimestamp)

            } catch (err) {
                console.log(err)
            }
            if (message.content.startsWith('!balance')){
                let bankee = message.author.username;
                let bankeeId = message.author.id;
                dbBank.serialize(() => {
                        dbBank.get('SELECT * FROM vault WHERE uid = ?', bankeeId, (err, res)=> {
                                message.channel.send(` \`\`\`css\n[hello, ${bankee}, your balance is: ${res.money}$]\`\`\` `)
                });
            });
        }

})

// Write chat messages to DB
function dbChatWrite(msgAuthor, msgAuthorId, message, msgTimestamp){
    dbChat.serialize(() => {
        dbChat.run('INSERT INTO client (username, userid, message, time) VALUES (?,?,?,?);', msgAuthor, msgAuthorId, message, msgTimestamp, (error) => {
            if (error) {
                    console.log(`ERROR INSERTING ${message} INTO TABLE 'client'` + error.message);
            } else {
                    console.log(`chat archive database write successful for message: ${message} --- write to table 'client'`);
            }
        })
    })
}

// Slash Interactions
client.on('interactionCreate', async interaction => {
        // USER REQUESTED AN IMAGE FROM THE DB
        if (interaction.commandName === 'photo') {
        console.log(`${interaction.user.username} initiated a photo dip ... posting photo`);
        dbTweet.serialize(() => {
            dbTweet.get('SELECT * FROM tweet_data WHERE media_type = "photo" ORDER BY RANDOM() LIMIT 1', (err, photoQuery)=> {
                if(photoQuery){
                interaction.reply(/*`${photoQuery.name} ...  ${emoji}   → ` */ `${photoQuery.media}`)
                } else { return }
                if (err) {
                    console.log(err)
                }
            })
        })
    }
    // USER REQUESTED A VIDEO FROM THE DB
    if (interaction.commandName === 'video') {
        console.log(`${interaction.user.username} initiated a video dip ... posting video`);
        dbTweet.serialize(() => {
            dbTweet.get('SELECT * FROM tweet_data WHERE media_type = "video/mp4" ORDER BY RANDOM() LIMIT 1', (err, videoQuery)=> {
                if(videoQuery){
                    interaction.reply(/*`${videoQuery.name} ...  ${emoji}   →   `*/ `${videoQuery.media}`)
                } else { return }
                if (err) {
                    console.log(err)
                }
            })
        })
    }
   // USER REQUESTED TEXT FROM THE DB
   if (interaction.commandName === 'text') {
        console.log(`${interaction.user.username} initiated a text dip ... posting text` );
        dbTweet.serialize(() => {
                    dbTweet.get('SELECT * FROM tweet_data WHERE media = "no media" ORDER BY RANDOM() LIMIT 1', (err, textQuery)=> {
                if(textQuery){
                        interaction.reply(/*`${textQuery.name} ...  :speaking_head:    → ` */ `${textQuery.text}`)
                } else { return }
                if (err) {
                    console.log(err)
                }
            })

        })
    }
    // USER INITIATED A GPT3 PROMPT REQUEST
    if (interaction.commandName === 'prompt') {
        console.log("\n --- prompt initiated");
        const prompt = interaction.options.getString('i');
        console.log(prompt);
        await interaction.deferReply();
        await(4000); // 15 min response window

        const user = interaction.user.username;
        const msgAuthorId = interaction.user.id;
        console.log(`${interaction.user.username} initiated a prompt ... processing request + database write` )

        const api = 'https://api.openai.com/v1/completions';
        const auth_header = `Bearer ${gpt_token}`;

        axios({
                method: 'post',
                url: api,
                headers: {
                        Authorization: auth_header,
                },
                data: {
                        model: 'text-davinci-002',
                        prompt: prompt,
                        max_tokens: 256,
                        temperature: 1.0,
                        top_p: 1.0,
                        frequency_penalty: 1.0,
                }
        })
        .then(result => {
                let msg = interaction.options.getString('i');
                let rpl = result.data.choices[0].text;
                let tst = rpl.split('\n');
                tst.splice(0,1);
                let fin = tst.join('\n');
                interaction.editReply(`\`\`\`fix\n"${msg}"\`\`\`\n\`\`\`yaml\n"${fin}"\n\`\`\` `)
                console.log(`prompt job completed for ... ${user} \n`)
        })
        .catch(err => {
                interaction.editReply(err)
                console.log(`gpt error:
                code:  ${err.code}
                `)
        })

    }
})
