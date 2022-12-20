/* APP REQUIRES */
const sqlite3 = require('sqlite3');
const axios = require('axios');
const fs = require('fs');
dotenv = require('dotenv').config({path: 'dot.env path'});


const bearer = process.env.bearer
const options ={
	headers: {
	'Authorization': `Bearer ${bearer}`,
	}
}


// use this array to add accounts to be scraped, or create an object doing the same.
const people = [
['twitterHandle', twitterId],
]

// Static assignment of the sql database path for the tweet data
const twitterDbPath = '';
const db = new sqlite3.Database(twitterDbPath, (err) => {
	if (err) {
			console.log("PROBLEM OPENING DATABASE")
	}
	else{
			console.log("SUCCESS --- OPENING DATABASE")
			//reportSize()
}
})

// Function selecting a twitter ID and then calling a function to perform the API call
function ppl(){
        people.forEach(person => {
                let name = person[0];
                let id = person[1];
                http(name, id)

        })
}
ppl()

function http(name, id){
axios.get(`https://api.twitter.com/2/users/${id}/liked_tweets?max_results=50&tweet.fields=attachments,id&expansions=attachments.media_keys&media.fields=media_key,type,variants,url`, options)
    .then((res) => {
//  console.log(res);
    builder(res,name)
        })
    .catch(resErr => {
        console.log("err: ", resErr);
    })
}

function builder(res,name){
    const tweets_with_media = res.data.data.map(t => ({
        ...t,
        media: t.attachments?.media_keys?.map(k => res.data.includes.media.find(m => m.media_key === k))
    }))
    console.log(`currently processing person:  ${name}`)
    tweets_with_media.forEach(r => {
        let dataArr = []; // mutable array
        let person =  name;
        const tweet_id = r.id;
        const text = r.text.replace(/(?:https:\/\/t\.co\/)[\w]{10}/,'').replace(/\n+/).replace(/(?:undefined)/);
        if(r.media){
            if (r.media[0].variants){ /* basically getting video */
                let br = r.media[0].variants.filter(e => e.content_type === 'video/mp4')
                let vidLrg_url = br.sort((a,b) => b.bit_rate - a.bit_rate)[0].url;
                dataArr.push(person, tweet_id, vidLrg_url, "video/mp4", text);
                dbWrite(dataArr)
                return ;
            } else { }

            if(r.media.length > 2){ /* media is photo - but tweet has more than 1 */
                let arr_media = []
                let len = r.media.length
                for (let i =  0; i < len; i++){
                    arr_media.push(r.media[i].url)
                }
                dataArr.push(person, tweet_id, arr_media, "photo array", text)
                dbWrite(dataArr);
                return ;
            } else if (r.media.length < 2) /*media is photo - but tweeet has one */
				{
					dataArr.push(person, tweet_id, r.media[0].url, "photo", text)
					dbWrite(dataArr);
					return ;
				}
        }
        dataArr.push(person, tweet_id, "no media", "text only", text)
        dbWrite(dataArr);
        return ;
    })
   console.log(`processing of person:  ${name}  ...  complete`);
}

function dbWrite(query) {
        db.serialize(() => {
            db.run(`INSERT OR IGNORE INTO tweet_data (name, tweet_id, media, media_type, text) VALUES (?,?,?,?,?);`, (query))
        })
}
