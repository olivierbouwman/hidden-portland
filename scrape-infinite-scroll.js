// Puppeteer will not run without these lines
const fs = require('fs');
const puppeteer = require('puppeteer');

function extractItems() {
    /*  For extractedElements, you are selecting the tag and class,
        that holds your desired information,
        then choosing the desired child element you would like to scrape from.
        in this case, you are selecting the
        "<div class=blog-post />" from "<div class=container />" See below: */
    // const scrapeBlocker = Array.from(document.querySelectorAll('h2')).find(el => el.textContent === 'Not Logged In');
    // if (typeof scrapeBlocker !== "undefined") {console.log('scrape blocked!');}
    const extractedElements = document.querySelectorAll('[role="feed"] .du4w35lb.k4urcfbm.l9j0dhe7.sjgh65i0');
    const items = [];
    for (let element of extractedElements) {
        // text = element.querySelectorAll('[style="text-align:start"], [style="text-align: start;"]');
        text = element.querySelectorAll('[data-ad-preview="message"]');
        likes = element.querySelectorAll('.pcp91wgn');
        link = element.querySelectorAll('a[href^="https://www.facebook.com/groups/Hiddenportlandforthecurious/posts/"]');
        const textCombined = [];
        for (let textElement of text) {
            textCombined.push(textElement.innerText);
            console.log({textCombined});
        }
        var post = {
            text: textCombined.join('\n'),
            likes: likes[0].innerText,
            link: link[0].href.split('?')[0],
            date: link[0].innerText,
        };
        items.push(post);
    }
    return items;
}

async function scrapeItems(
    page,
    extractItems,
    itemCount,
    scrollDelay = 0,
    // scrollDelay = Math.random() * (2000 - 250) + 250,
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
            fs.writeFileSync('./data.json', JSON.stringify(items, null, 2) , 'utf-8');
        }
    } catch(e) { }
    return items;
}

(async () => {
    // Set up Chromium browser and page.
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        // devtools: true,
    });
    const page = await browser.newPage();
    page.setViewport({ width: 1280, height: 926 });
    // Don't download images
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (req.resourceType() === 'image') {
            req.abort();
        } else {
            req.continue();
        }
    });

    // Navigate to the example page.
    await page.goto('https://www.facebook.com/groups/Hiddenportlandforthecurious?sorting_setting=CHRONOLOGICAL');

    const cookies = [
        {
            'name': 'xs',
            'value': '26%3AY6O01Y759DT_dg%3A2%3A1639810573%3A-1%3A-1'
        },
        {
            'name': 'c_user',
            'value': '100076084785759'
        }
    ];

    await page.setCookie(...cookies);
    await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });

    // Auto-scroll and extract desired items from the page. Currently set to extract ten items.
    const items = await scrapeItems(page, extractItems, 250000);

    // Save extracted items to a new file.
    // fs.writeFileSync('./data.json', JSON.stringify(items, null, 2) , 'utf-8');

    // Close the browser.
    // await browser.close();
})();