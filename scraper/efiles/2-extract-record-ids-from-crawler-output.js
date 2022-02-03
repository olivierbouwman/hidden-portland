const playwright = require('playwright');
const fs = require('fs');
const url = require('url');
const path = require('path');
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
    let pageCounter = 1;
    try {
        while (true) {
            const fileurl = url.pathToFileURL(path.join(__dirname, '../../scraper-output', 'efiles-' + pageCounter + '.html')).href;
            await page.goto(fileurl);
            const results = await page.locator('.search-results tr');
            const resultsCount = await results.count();
            for (let index = 0; index < resultsCount; index++) {
                const id = await page.locator('.search-results tr >> nth=' + index).getAttribute("trim-uri");
                if (id !== null) {
                    let efilesItem = {
                        id: id,
                    };
                    items.push(efilesItem);
                }
            }
            pageCounter = pageCounter + 1
        }
    } catch(e) {
        // This is hopefully because we reach a page that doesn't exist.
        fs.writeFileSync('./data-efiles.json', JSON.stringify(items, null, 2), 'utf-8');
        await browser.close();
        return;
    }
}

main();
