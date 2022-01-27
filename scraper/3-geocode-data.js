const fs = require('fs');
const https = require('https')
var url_prefix = 'https://maps.googleapis.com/maps/api/geocode/json?components=locality%3APortland%7Cadministrative_area%3AOR%7Ccountry%3AUS&address='
var url_suffix = ', Portland, OR&key=' + process.env.GOOGLE_MAPS_API_KEY;

let rawdata = fs.readFileSync('data-efiles.json');
let posts = JSON.parse(rawdata);
let counter = 0;
let counterFail = 0;

async function run() {
    for (let post of posts) {
        // Only process if it hasn't been before and also process a certain date to prevent accidental high cost.
        if (post.text.length > 5 && post.latlong == undefined) { // && post.date.substring(0,4) == "2021") {
            counter = counter + 1
            let text = post.text;
            // Filter efiles specific way of writing.
            // if (post.source == "efiles") {
                // Remove ID.
                text = text.replace(/A\d\d\d\d-\d+\.\d+ ?:/g, "");
                text = text.replace(/A\d\d\d\d-\d+\. ?:/g, "");
                // Filter html tags
                text = text.replace(/<\/?[^>]+(>|$)/g, ", ");
                text = text.replace(/ looking (north|northwest|northeast|south|southwest|southeast|east|west) (to|towards|from) /gi, ' & ');
                text = text.replace(/ just (north|northwest|northeast|south|southwest|southeast|east|west) (of) /gi, ' & ');
                text = text.replace(/ (north|northwest|northeast|south|southwest|southeast|east|west) of /gi, ' & ');
                text = text.replace(/ at /gi, ' & ');
            // }
            // if (post.source == "hp") {
            text = text.replace(/… More/g, ' ');
            // }
            text = text.replace(/#/g, ', ');
            text = text.replace(/\n/g, ', ');
            if (!text.includes("&")) {
                // If there is no ampersand, we assume ' and ' is for the cross streets. Google seems to do better with ampersands.
                text = text.replace(/ and /gi, ' & ');
            }
            text = text.replace(/ near /gi, ' & ');
            text = text.replace(/ between /gi, ' & ');
            text = text.replace(/[^A-Za-z0-9 ,&]/g, " ");
            text = text.replace(/\s+/g, ' ').trim()
            const url = url_prefix + encodeURIComponent(text) + encodeURI(url_suffix);
            post = await processRecord(post, url);
            let aatemp = post.latlong.lat + ", " + post.latlong.lng;
            fs.writeFileSync('data-efiles.json', JSON.stringify(posts, null, 2) , 'utf-8')
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
                    post.latlong = response.results[0].geometry.location;
                }
                else {
                    counterFail = counterFail + 1;
                    post.latlong = "no result";
                }
                resolve(post);
            });
        }).on('error', function(e){
            console.log("Got an error: ", e);
            console.log("post id: " + post.id);
        });
    });
}
