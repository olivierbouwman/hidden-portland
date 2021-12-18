// Puppeteer will not run without these lines
const fs = require('fs');
const puppeteer = require('puppeteer');

function extractItems() {
    /*  For extractedElements, you are selecting the tag and class,
        that holds your desired information,
        then choosing the desired child element you would like to scrape from.
        in this case, you are selecting the
        "<div class=blog-post />" from "<div class=container />" See below: */
    const extractedElements = document.querySelectorAll('[role="feed"] .du4w35lb.k4urcfbm.l9j0dhe7.sjgh65i0');
    const items = [];
    for (let element of extractedElements) {
        post_text = element.querySelectorAll('[style="text-align:start"], [style="text-align: start;"]');
        style="text-align: start;"
        items.push(post_text[0].innerText);
    }
    return items;
}

async function scrapeItems(
    page,
    extractItems,
    itemCount,
    scrollDelay = 800,
) {
    let items = [];
    try {
        let previousHeight;
        while (items.length < itemCount) {
            items = await page.evaluate(extractItems);
            previousHeight = await page.evaluate('document.body.scrollHeight');
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
            await page.waitForTimeout(scrollDelay);
        }
    } catch(e) { }
    return items;
}

(async () => {
    // Set up Chromium browser and page.
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 926 });

    // Navigate to the example page.
    await page.goto('https://www.facebook.com/groups/Hiddenportlandforthecurious?sorting_setting=CHRONOLOGICAL');

    // Auto-scroll and extract desired items from the page. Currently set to extract ten items.
    const items = await scrapeItems(page, extractItems, 100);

    // Save extracted items to a new file.
    fs.writeFileSync('./items.txt', items.join('\n') + '\n');

    // Close the browser.
    await browser.close();
})();