const playwright = require('playwright');
const fs = require('fs');
async function main() {
    const browser = await playwright.firefox.launch({
        headless: false // setting this to true will not run the UI
    });
    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/15.4 Mobile/15A372 Safari/604.1"
    });
    await context.addCookies([{name:"xs", value: "34%3AqgOE8BTIYS5yMA%3A2%3A1642120648%3A-1%3A-1%3A%3AAcUxYbgEq1Uvogo1z9A022KiHnA0TyvSd022bH2_uKg", domain: ".facebook.com", path: "/"}]);
    await context.addCookies([{name:"c_user", value: "100076956680790", domain: ".facebook.com", path: "/"}]);
    const page = await context.newPage();
    await page.route('**/*', (route) => {
        return route.request().resourceType() === 'image'
        || route.request().resourceType() === 'media'
        || route.request().resourceType() === 'font'
        // || route.request().resourceType() === 'stylesheet'
            ? route.abort()
            : route.continue()
    });
    // - stylesheet
    // - image
    // - media
    // - font
    // - script
    // - texttrack
    // - xhr
    // - fetch
    // - eventsource
    // - websocket
    // - manifest
    // - other
    await page.setViewportSize({
        width: 375,
        height: 667
    });
    await page.goto('https://www.facebook.com/groups/Hiddenportlandforthecurious?sorting_setting=CHRONOLOGICAL');
    const items = await scrapeItems(page);
}

main();

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    });
}

async function scrapeItems(
    page
) {
    try {
        let saveCounter = 0;
        let scrollDelay = 250;
        let saveDelay = 2400;
        while (true) {
            await page.mouse.wheel(0,100);
            await delay(scrollDelay);
            saveCounter = saveCounter + 1;
            if (saveCounter == saveDelay) {
                let now     = new Date();
                let year    = now.getFullYear();
                let month   = now.getMonth()+1;
                let day     = now.getDate();
                let hour    = now.getHours();
                let minute  = now.getMinutes();
                let second  = now.getSeconds();
                let datetime = year + "-" + month + "-" + day + "_" + hour + "-" + minute + "-" + second;
                let content = await page.content();
                fs.writeFileSync('./output/hp-' + datetime + '.html', content, 'utf-8');
                saveCounter = 0;
            }
        }
    } catch(e) {
        console.log('error');
        console.log(e);
    }
}
