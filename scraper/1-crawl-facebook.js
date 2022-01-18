const playwright = require('playwright');
const fs = require('fs');
async function main() {
    const browser = await playwright.firefox.launch({
        headless: false // setting this to true will not run the UI
    });
    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/15.4 Mobile/15A372 Safari/604.1"
    });
    // Set these in your terminal using `export FACEBOOK_XS=[code]`;
    await context.addCookies([{name:"xs", value: process.env.FACEBOOK_XS, domain: ".facebook.com", path: "/"}]);
    await context.addCookies([{name:"c_user", value: process.env.FACEBOOK_C_USER, domain: ".facebook.com", path: "/"}]);
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
        let scrollDelay = 500;
        let saveDelay = 1200;
        while (true) {
            await page.mouse.wheel(0,100);
            await delay(scrollDelay);
            saveCounter = saveCounter + 1;
            if (saveCounter == saveDelay) {
                saveCounter = 0;
                let now     = new Date();
                let year    = now.getFullYear();
                let month   = now.getMonth()+1;
                let day     = now.getDate();
                let hour    = now.getHours();
                let minute  = now.getMinutes();
                let second  = now.getSeconds();
                let datetime = year + "-" + month + "-" + day + "_" + hour + "-" + minute + "-" + second;
                let content = await page.content();
                fs.writeFileSync('./scraper-output/hp-' + datetime + '.html', content, 'utf-8');
            }
        }
    } catch(e) {
        console.log('error');
        console.log(e);
    }
}
