// Puppeteer will not run without these lines
const fs = require('fs');
const puppeteer = require('puppeteer');

// note: trying manually in brower using this code to scroll down:
// for(var i = 0; i < 100; i++){ setTimeout(() => {window.scrollTo(0, document.body.scrollHeight);}, i*1000);}
// also: Type about:config in the address bar and press Enter (accept the risk, if asked) Type in the search bar : permissions.default.image and set its value to 2 (was 1)

// Read our existing post data so we can update/add.
// let rawdata = fs.readFileSync('data.json');
// let posts = JSON.parse(rawdata);

function extractItems() {
    const items = [];
    let text;
    let likes;
    let link;
    document.querySelectorAll('[role="feed"] .du4w35lb.k4urcfbm.l9j0dhe7.sjgh65i0').forEach(function( node ) {
        text = node.querySelectorAll('[data-ad-preview="message"]');
        if (text.length > 0) {
            likes = node.querySelectorAll('.pcp91wgn');
            link = node.querySelectorAll('a[href^="https://www.facebook.com/groups/Hiddenportlandforthecurious/posts/"]');
            const textCombined = [];
            for (let textElement of text) {
                textCombined.push(textElement.innerText);
            }
            let post = {
                text: textCombined.join('\n'),
                likes: likes[0].innerText,
                link: link[0].href.split('?')[0],
                date: link[0].innerText,
            };
            // See if this post is already in our source data.
            // for (var i=0 ; i < post.list.length ; i++) {
            //     if (obj.post[i][searchField] == searchVal) {
            //         results.push(obj.list[i]);
            //     }
            // }
            items.push(post);
            // Try to keep the dom from getting too big, guessing that is what eventually crashes the browser.
            node.parentNode.removeChild( node );
            // node.innerHTML = "captured";
        }
    });
    return items;
}

async function scrapeItems(
    page,
    extractItems,
    itemCount,
    scrollDelay = 1000,
    // scrollDelay = Math.random() * (2000 - 250) + 250,
) {
    let items = [];
    try {
        let previousHeight;
        while (items.length < itemCount) {
            itemsNew = await page.evaluate(extractItems);
            items = items.concat(itemsNew);
            previousHeight = await page.evaluate('document.body.scrollHeight');
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            try {
                await page.waitForFunction(`document.body.scrollHeight != ${previousHeight}`, {timeout: 20000});
            } catch (err) {
                console.log('waiting for new posts timed out.');
            }
            await page.waitForTimeout(scrollDelay);
            fs.writeFileSync('./data.json', JSON.stringify(items, null, 2) , 'utf-8');
            console.log(items.length);
            // await page._client.send('HeapProfiler.enable');
            // await page._client.send('HeapProfiler.collectGarbage');
            // await page._client.send('HeapProfiler.disable');
            // await page.evaluate(() => gc());
            // page.dispose(); // try to fix memory issue. Probably related to V8 4GB limit.
        }
    } catch(e) { }
    return items;
}

(async () => {
    // Set up Chromium browser and page.
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--js-flags=--expose-gc', '--js-flags="--max-old-space-size=8192"', '--js-flags="--max-old-space-size=8192"'],
        // devtools: true,
    });
    const page = await browser.newPage();
    page.setViewport({ width: 375, height: 5000 });
    // Don't download images
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        // if (req.resourceType() === 'stylesheet' || req.resourceType() === 'image' || req.resourceType() === 'font') {
        if (req.resourceType() === 'media' || req.resourceType() === 'image' || req.resourceType() === 'font') {
            req.abort();
        } else {
            req.continue();
        }
    });

    // Navigate to the example page.
    await page.goto('https://www.facebook.com/groups/Hiddenportlandforthecurious?sorting_setting=CHRONOLOGICAL');

    // If we want to get a lot of old posts, we need a facebook user, otherwise we get blocked after something like 168 posts.
    const cookies = [
        {
            'name': 'xs',
            'value': '20%3AyNA8y4_tCG_EHw%3A2%3A1642118649%3A-1%3A-1'
        },
        {
            'name': 'c_user',
            'value': '100076956680790'
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
