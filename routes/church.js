var express = require('express');
var https = require('https');
var mcache = require('memory-cache');
var xml2js = require('xml2js');
var router = express.Router();
const parser = new xml2js.Parser();

router.get('/', function(req, res, next) {

    // check cache
    let key = '__express__' + req.originalUrl || req.url;
    let cachedBody = mcache.get(key);

    if (cachedBody) {
        // console.log(`Cache hit: ${cachedBody}`);
        res.set('Content-Type', 'text/xml');
        res.send(cachedBody);
    } else {
        https.get("https://www.omnycontent.com/d/playlist/4b5f9d6d-9214-48cb-8455-a73200038129/58b96555-229e-4e83-9f3b-a92b00874970/2330c70f-f043-4c6c-ba75-a92b00874974/podcast.rss", function(resp) {
            let data = '';
            resp.on('data', function(stream) {
                data += stream;
            });
            resp.on('end', function(){
                parser.parseString(data, function(error, result) {
                    if(error === null) {
                        console.log(result);
                        // console.log(result.rss.channel);

                        let indicesToRemove = [];
                        result.rss.channel[0].item.forEach((element, index) => {
                            if (!element.title[0].includes("The Church of Lazlo Podcast")) {
                                indicesToRemove.push(index)
                            }
                        });
                        // indicesToRemove.sort()
                        indicesToRemove.reverse()
                        indicesToRemove.forEach(indexToRemove => {
                            result.rss.channel[0].item.splice(indexToRemove, 1)
                        });

                        var builder = new xml2js.Builder();
                        var xml = builder.buildObject(result);
                        res.set('Content-Type', 'text/xml');
                        var cacheTime = 10 * 60 * 1000; // 10 minutes
                        mcache.put(key, xml, cacheTime);
                        res.send(xml);
                    }
                    else {
                        console.log(error);
                    }
                    
                });
            });
        });
        // res.send('respond with a resource');
        // TODO: handle errors
    }
});

module.exports = router;
