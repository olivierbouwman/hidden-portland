const playwright = require('playwright');
const fs = require('fs');
async function main() {
    const items = [];
    const browser = await playwright.firefox.launch({
        headless: false // setting this to true will not run the UI
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    console.log("Loading input file...");
    var contentHtml = fs.readFileSync('./scraper-output/hidden-portland-june-2015.html', 'utf8');
    await page.setContent(contentHtml, {timeout: 0});
    console.log("Input file loaded.");
    const articles = await page.locator('article');
    const articleCount = await articles.count();
    for (var index = 0; index < articleCount ; index++) {
        try {
            const article = await articles.nth(index);
            const date_string = await article.locator('abbr >> nth=0').innerText();
            const post_date = cleanDateTimeString(date_string);
            // if a post is a share like https://m.facebook.com/groups/Hiddenportlandforthecurious/permalink/10165748138935062/
            // we might want to include the text from the original, we are not right now due to nth=0.
            const post_text = await article.locator('._5rgt._5nk5._5msi >> nth=0').innerText();
            const post_id_raw = await article.locator('._2ip_._4b44').getAttribute("id");
            const post_id = await post_id_raw.split("_").pop();
            const post_reactions = await article.locator('._1g06').innerText();
            // const post_comments_raw = await article.locator('._1j-c >> nth=0').innerText();
            // const post_comments = post_comments_raw.split(" ")[0];
            let postItem = {
                date: post_date,
                id: post_id,
                text: post_text,
                likes: post_reactions,
                // comments: post_comments,
            };
            items.push(postItem);
        } catch (err) {
            console.log(err);
        }
        if (index % 10 === 0) {
            console.log(index + " out of " + articleCount + " articles processed");
        }
    };
    await browser.close();
    console.log("Writing output file...");
    fs.writeFileSync('./data.json', JSON.stringify(items, null, 2) , 'utf-8');
    console.log("Done.");
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
