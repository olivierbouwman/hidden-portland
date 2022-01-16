const fs = require('fs');
const https = require('https')
var url_prefix = 'https://maps.googleapis.com/maps/api/geocode/json?address='
var url_suffix = ', Portland, OR&key=' + process.env.GOOGLE_MAPS_API_KEY;

let rawdata = fs.readFileSync('data.json');
let posts = JSON.parse(rawdata);

// there was a bug with ampersands so we migh want to redo geocoding of data-live items or just the entirety of 2021.

async function run() {
    for (let post of posts) {
        // Only process if it hasn't been before and also process a certain date to prevent accidental high cost.
        if (post.latlong == undefined && post.date.substring(0,7) == "2021-12") {
            let text = post.text;
            text = text.replace("#", "");
            const url = url_prefix + encodeURIComponent(text) + encodeURI(url_suffix);
            await processRecord(post, url);
            fs.writeFileSync('data.json', JSON.stringify(posts, null, 2) , 'utf-8')
        }
    }
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
                    post.latlong = response.results[0].geometry.location;
                }
                else {
                    post.latlong = "no result";
                }
                resolve();
            });
        }).on('error', function(e){
            console.log("Got an error: ", e);
        });
    });
}

