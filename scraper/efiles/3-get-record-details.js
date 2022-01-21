const playwright = require('playwright');
const fs = require('fs');
const url = require('url');
const path = require('path');

// This is the file that already contains geocoding.
let sourceFile = fs.readFileSync('data-efiles.json');
let sourceData = JSON.parse(sourceFile);

async function main() {
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
    try {
        for (let item of sourceData) {
            if (!item.date) {
                let id = item.id;
                await page.goto("https://efiles.portlandoregon.gov/Record/" + id);
                const title = await page.locator('#prop-RecordTypedTitle').innerText();
                const dateString = await page.locator('#prop-RecordDateCreated').innerText();
                const date = await cleanDateTimeString(dateString);
                const notesRaw = await page.locator('#prop-RecordNotes');
                const notesCount = await notesRaw.count();
                let text = title;
                if (notesCount > 0) {
                    notes = await notesRaw.innerText();
                    text = text + "<br>" + notes;
                }
                item.date = date;
                item.text = text;
                fs.writeFileSync('data-efiles.json', JSON.stringify(sourceData, null, 2) , 'utf-8')
            }
        }
        console.log('done');
    } catch(e) {
        console.log('error');
        console.log(e);
    }
}

function cleanDateTimeString(dateTimeString) {
    // Remove time from strings like 'Monday, December 30, 1907 at 4:00 PM'
    let dateParsed = new Date(Date.parse(dateTimeString.split(" at ")[0]));
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

function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}

main();
