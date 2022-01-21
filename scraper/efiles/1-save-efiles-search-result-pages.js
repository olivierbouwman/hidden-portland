const playwright = require('playwright');
const fs = require('fs');
async function main() {
    const browser = await playwright.firefox.launch({
        headless: false // setting this to true will not run the UI
    });
    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/15.4 Mobile/15A372 Safari/604.1"
    });
    const page = await context.newPage();
    await page.route('**/*', (route) => {
        return route.request().resourceType() === 'image'
            ? route.abort()
            : route.continue()
    });
    await page.setViewportSize({
        width: 375,
        height: 667
    });
    await page.goto('https://efiles.portlandoregon.gov/Record?q=&sortBy=recCreatedOn&pagesize=100&filter=electronic&filter=type%3A%5Bname%3Aarchival+photo%5D');
    const items = await scrapeItems(page);
}

main();

async function scrapeItems(
    page
) {
    try {
        let pageCounter = 1;
        let previousPage = "";
        while (true) {
            let content = await page.content();
            fs.writeFileSync('./scraper-output/efiles-' + pageCounter + '.html', content, 'utf-8');
            const nextPage = await page.locator('a >> text=>').getAttribute("href");
            console.log(nextPage);
            pageCounter = pageCounter + 1;
            if (nextPage == previousPage || nextPage == "#") {
                return;
            }
            previousPage = nextPage;
            await page.goto('https://efiles.portlandoregon.gov/Record' + nextPage);
        }
    } catch(e) {
        console.log('error');
        console.log(e);
    }
}