let rp = require("request-promise")
let cheerio = require("cheerio")

function autoParse(body, response, resolveWithFullResponse) {
    // FIXME: The content type string could contain additional values like the charset. 
    // Consider using the `content-type` library for a robust comparison. 
    if (response.headers['content-type'].match(/application\/json/) ) {
        return JSON.parse(body);
    } else if (response.headers['content-type'].match(/text\/html/) ) {
        return cheerio.load(body);
    } else {
        return body;
    }
}
 
var rpap = rp.defaults({ 
    transform: autoParse,
    headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36"
    }
});

rpap.jar()

module.exports = rpap