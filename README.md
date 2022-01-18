# Hidden Portland for the Curious
Find more ways to use the awesome https://www.facebook.com/groups/Hiddenportlandforthecurious

# Map
A live map can be found at https://olivierbouwman.github.io/hidden-portland/

# Ideas
*. Find a way to keep the post list updated reliably and at least once a day. Idea is to use the Facebook Groups API for this but it's currently broken (https://developers.facebook.com/support/bugs/586024735942061). We could try the crawler approach and see for how long it'll work. Likely use GitHub Actions to get new posts once a day and update the data file.
*. Find a way to include the image or entire post on the marker popup.
*. When showing multiple years, consider shading older markers.
*. Improve geocoding (analyze misplaced markers).
*. Combine markers placed on the same spot into the same popup.