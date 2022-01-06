const fs = require('fs');
const https = require('https')
var url_prefix = 'https://maps.googleapis.com/maps/api/geocode/json?address='
var url_suffix = ', Portland, OR&key=' + process.env.GOOGLE_MAPS_API_KEY;

let rawdata = fs.readFileSync('data.json');
let posts = JSON.parse(rawdata);
let postCounter = 0;
let postTotal = 0;

function processRecord(post, url) {
    https.get(url, function(res){
        var body = '';

        res.on('data', function(chunk){
            body += chunk;
        });

        res.on('end', function(){
            postCounter++;
            console.log(postCounter);
            console.log(url);
            var response = JSON.parse(body);
            if (response.results[0] !== undefined) {
                console.log("Got a response: ", response.results[0].geometry.location);
                post.latlong = response.results[0].geometry.location;
            }
            if (postTotal == postCounter) {
                fs.writeFileSync('data.json', JSON.stringify(posts, null, 2) , 'utf-8')
                console.log('done');
            }
        });
    }).on('error', function(e){
        console.log("Got an error: ", e);
    });
}

function run() {

    postTotal = posts.length;
    // postTotal = 4; // DEBUG
    var postCounterDebug = 0;
    // processRecord(posts[0], "https://maps.googleapis.com/maps/api/geocode/json?address="); // DEBUG
    for (let post of posts) {
        postCounterDebug++;
        let text = post.text;
        text = text.replace("#", "");
        const url = url_prefix + encodeURI(text + url_suffix);
        processRecord(post, url);
    }
}

run();