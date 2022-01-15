# Hidden Portland for the Curious
Find more ways to use the awesome https://www.facebook.com/groups/Hiddenportlandforthecurious

# Map
A live map can be found at https://olivierbouwman.github.io/hidden-portland/

# How it's made

## Get Facebook posts
Facebook doesn't have a way to get posts older than 90 days from the Groups API so to get older post we have to scrape the site.
1. Use the post scraper, this is a very slow process, if it runs too fast, Facebook will block it. 
3. Extract the post data, this creates a clean list based on the data from Facebook that we can use for other purposes.

## Add location to posts 
We use Google Maps API to add locations to posts. It handles natural text so no pre-processing is done to the post text. It's not perfect but it's about 80% correct.

## Make a map
We use Leaflet.js for the map. There are filters for year, likes, and text search.

# Next steps
1. Find a way to keep the post list updated reliably and at least once a day. Idea is to use the Facebook Groups API for this but it's currently broken (https://developers.facebook.com/support/bugs/586024735942061). We could try the scraper approach and see for how long it'll work. Likely use GitHub Action to get new posts once a day and update the data file.