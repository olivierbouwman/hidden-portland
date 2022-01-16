const playwright = require('playwright');
const fs = require('fs');
let dataString = "";
async function main() {
    const items = [];
    const browser = await playwright.firefox.launch({
        headless: false
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.route('**/*', (route) => {
        return route.request().resourceType() === 'image'
        || route.request().resourceType() === 'stylesheet'
        || route.request().resourceType() === 'media'
        || route.request().resourceType() === 'font'
        || route.request().resourceType() === 'script'
        || route.request().resourceType() === 'texttrack'
        || route.request().resourceType() === 'xhr'
        || route.request().resourceType() === 'fetch'
        || route.request().resourceType() === 'eventsource'
        || route.request().resourceType() === 'websocket'
        || route.request().resourceType() === 'manifest'
        || route.request().resourceType() === 'other'
            ? route.abort()
            : route.continue()
    });

    // Large crawl files need to be read in smaller pieces.
    const CHUNK_SIZE = 10000000; // 10MB
    const stream = fs.createReadStream('./scraper-output/hidden-portland-june-2015.html', { highWaterMark: CHUNK_SIZE });
    for await(const data of stream) {
        // Prepend any leftover bit from the last one.
        dataString = dataString + data.toString();
        while (true) {
            // We're processing one article/post at a time to increase speed.
            let article = await extractHtml("<article", "</article>");
            if (article.length == 0) {
                break;
            }
            if (article.length < 10) {
                await browser.close();
                console.log("Writing output file...");
                fs.writeFileSync('./data-alt.json', JSON.stringify(items, null, 2) , 'utf-8');
                console.log("Done.");
                return;
            }
            await page.setContent(article);
            try {
                const date_string = await page.locator('abbr >> nth=0').innerText();
                const post_date = await cleanDateTimeString(date_string);
                // if a post is a share like https://m.facebook.com/groups/Hiddenportlandforthecurious/permalink/10165748138935062/
                // we might want to include the text from the original, we are not right now due to nth=0.
                const post_text = await page.locator('._5rgt._5nk5._5msi >> nth=0').innerText();
                const post_id_raw = await page.locator('._52jc._5qc4._78cz._24u0._36xo a >> nth=0').getAttribute("href");
                const post_id = post_id_raw.match("/permalink/(.*)/")[1];
                const post_reactions_raw = await page.locator('._1g06');
                const post_reactions_element_count = await post_reactions_raw.count();
                let post_reactions = -1;
                if (post_reactions_element_count > 0) {
                    post_reactions = await post_reactions_raw.innerText();
                }
                // const post_comments_raw = await page.locator('._1j-c >> nth=0').innerText();
                // const post_comments = post_comments_raw.split(" ")[0];
                let postItem = {
                    date: post_date,
                    id: post_id,
                    text: post_text,
                    likes: post_reactions,
                    // comments: post_comments,
                };
                items.push(postItem);
                if (items.length % 100 === 0) {
                    console.log(items.length + " articles processed");
                }
            } catch (err) {
                console.log(err);
                console.log(article);
            }
        }
    }
}

main();

function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}

function cleanDateTimeString(dateTimeString) {
    // Remove time from strings like 'January 12 at 6:44 PM'
    dateString = dateTimeString.split(" at ")[0];
    dateNumbers = dateString.match(/\d+/g);
    if (dateTimeString.endsWith(" hrs")) {
        dateParsed = new Date( Date.now() - (1000 * 60 * 60 * dateNumbers[0]));
    }
    else if (dateTimeString.startsWith("Yesterday")) {
        dateParsed = new Date( Date.now() - (1000 * 60 * 60 * 24));
    }
    else {
        if (dateNumbers.length == 1) {
            let now = new Date();
            let year = now.getFullYear();
            dateString = dateString + " " + year
        }
        dateParsed = new Date(dateString);
    }
    if (isValidDate(dateParsed)) {
        let year    = dateParsed.getFullYear();
        let month   = dateParsed.getMonth()+1;
        let day     = dateParsed.getDate();
        dateStringProcessed = year + "-" + month + "-" + day ;
    } else {
        dateStringProcessed = "";
        console.log("couldn't parse date: " + dateString);
    }
    return dateStringProcessed;
}

function extractHtml(valueStart, valueEnd) {
    let start = dataString.indexOf(valueStart);
    let end = dataString.indexOf(valueEnd, start);
    if (end < start) {
        // We probably reached the end of this file chunk.
        return "";
    }
    let output = dataString.substr(start, end - start + valueEnd.length);
    // Remove article we just processed.
    dataString = dataString.substr(end + valueEnd.length);
    return output;
}