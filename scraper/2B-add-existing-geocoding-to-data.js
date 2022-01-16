const fs = require('fs');

// This is the file that already contains geocoding.
let rawdataSource = fs.readFileSync('data-live.json');
let postsSource = JSON.parse(rawdataSource);

// This is the file that we want to add geocoding to.
let rawdataTarget = fs.readFileSync('data.json');
let postsTarget = JSON.parse(rawdataTarget);

function run() {
    for (let postSource of postsSource) {
        let id = postSource.id;
        let latlong = postSource.latlong;

        for (let postTarget of postsTarget) {
            if (postTarget.id == postSource.id) {
                postTarget.latlong = postSource.latlong;
            }
        }
    }
    fs.writeFileSync('data-geocoded.json', JSON.stringify(postsTarget, null, 2) , 'utf-8')
    console.log('done');
}

run();