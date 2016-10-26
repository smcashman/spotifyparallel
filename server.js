var unirest = require('unirest');
var express = require('express');
var events = require('events');
var app = express();

var getFromApi = function(endpoint, args) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/' + endpoint)
        .qs(args)
        .end(function(response) {
            if (response.ok) {
                emitter.emit('end', response.body);
            } else {
                emitter.emit('error', response.code);
            }
        });
    return emitter;
};

app.use(express.static('public'));
app.use(express.static('public' + '/View'));

app.get('/search/:name', function(req, res) {
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    searchReq.on('end', function(item) {
        //console.log(artist.id.length);
        console.log(item);
        // console.log(item.artists.total);
        if (item.artists.total == 0){
            console.log("artist not found");
            res.json("{ artists: { href: '404.html', items: [ [Object] ], limit: 1, next: '404.html', offset: 0, previous: null, total: 12 } } { external_urls: { spotify: 'https://open.spotify.com/artist/1HY2Jd0NmPuamShAr6KMms' }, followers: { href: null, total: 2016056 }, genres: [ 'dance pop', 'pop', 'pop christmas', 'post-teen pop' ], href: '404.html', id: '1HY2Jd0NmPuamShAr6KMms', images: [ { height: 640, url: 'fontconfig_error-100616973-primary.idge.jpg', width: 640 }, { height: 320, url: 'fontconfig_error-100616973-primary.idge.jpg', width: 320 }, { height: 160, url: 'fontconfig_error-100616973-primary.idge.jpg', width: 160 } ], name: 'Artist does not exist', popularity: 85, type: 'artist', uri: 'spotify:artist:1HY2Jd0NmPuamShAr6KMms' }")
        } else{
        var artist = item.artists.items[0];
         console.log(artist);
        var relatedArtistRequest = getFromApi('artists/' + artist.id + '/related-artists');
        relatedArtistRequest.on('end', function(item) {
            artist.related = item.artists;
            var remaining = artist.related.length
            artist.related.forEach(function(artistInfo, index) {
                var artistId = artistInfo.id + '/top-tracks'
                var topTracksRequest = getFromApi('artists/' + artistId, {
                    country: 'us'
                });
                topTracksRequest.on('end', function(item) {
                    artist.related[index].tracks = item.tracks
                    remaining--;
                    if (remaining === 0) {
                        res.json(artist);
                    }
                })
                topTracksRequest.on('error', function(code) {
                    res.sendStatus(code);
                });

            })
            relatedArtistRequest.on('error', function(code) {
                res.sendStatus(code);
            });
        })
};
        searchReq.on('error', function(code) {
            res.sendStatus(code);
        });
    });



    // relatedArtistRequest.on('error', function(code){
    //     res.sendStatus(code);
    // });


});




app.listen(process.env.PORT || 8080);