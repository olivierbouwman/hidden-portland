const fs = require('fs');
const https = require('https')
var url_prefix = 'https://maps.googleapis.com/maps/api/geocode/json?address='
var url_suffix = ', Portland, OR&key=' + process.env.GOOGLE_MAPS_API_KEY;

let rawdata = fs.readFileSync('data.json');
let posts = JSON.parse(rawdata);
let counter = 0;
let counterFail = 0;

async function run() {
    for (let post of posts) {
        // Only process if it hasn't been before and also process a certain date to prevent accidental high cost.
        if (post.text.length > 5 && post.lat == undefined && post.date.substring(0,4) == "2019") {
            counter = counter + 1
            let text = post.text;
            text = text.replace(/… More/g, ' ');
            text = text.replace(/#/g, ', ');
            text = text.replace(/\n/g, ', ');
            if (!text.includes("&")) {
                // If there is no ampersand, we assume ' and ' is for the cross streets. Google seems to do better with ampersands.
                text = text.replace(/ and /g, ' & ');
            }
            text = text.replace(/ near /g, ' & ');
            text = text.replace(/ between /g, ' & ');
            text = text.replace(/[^A-Za-z0-9 ,&]/g, " ");
            text = text.replace(/\s+/g, ' ').trim()
            const url = url_prefix + encodeURIComponent(text) + encodeURI(url_suffix);
            post = await processRecord(post, url);
            let aatemp = post.lat + ", " + post.lng;
            fs.writeFileSync('data.json', JSON.stringify(posts, null, 2) , 'utf-8')
        }
    }
    console.log("Geocoded " + counter + " items, of which " + counterFail + " could not be geocoded.");
}

run();

function processRecord(post, url) {
    return new Promise((resolve, reject) => {
        https.get(url, function(res){
            var body = '';

            res.on('data', function(chunk){
                body += chunk;
            });

            res.on('end', function(){
                console.log(url);
                var response = JSON.parse(body);
                if (response.results[0] !== undefined) {
                    console.log("Got a response: ", response.results[0].geometry.location);
                    post.lat = response.results[0].geometry.location.lat;
                    post.lng = response.results[0].geometry.location.lng;
                }
                else {
                    counterFail = counterFail + 1;
                    post.lat = 0;
                }
                resolve(post);
            });
        }).on('error', function(e){
            console.log("Got an error: ", e);
            console.log("post id: " + post.id);
        });
    });
}

