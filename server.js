/**
 * Created by marcelo on 5/15/16.
 */
var express = require('express');
var bodyParser = require('body-parser');
var unirest = require('unirest');
var async = require('async');

var app = express();
var router = express.Router();
var port = process.env.PORT;
var accApiKey = process.env.ACCUWEATHERAPIKEY;
var localApiKey = process.env.LOCALAPIKEY;

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


// =============================================================================
// API routes
// =============================================================================

// middleware to use for all requests
router.use(function (req, res, next) {

    if (req.header('apikey') == localApiKey) {
        next();
    }
    else {
        res.json({message: 'invalid key'});
    }
});

//GET MIGRAINE INDEX
router.get('/migraineindex', function (req, res) {

    var cityName = req.query.c;


    async.waterfall([
        async.apply(getCity, cityName), get1dayForecast
    ], function (err, result) {
        res.json({migraineIndex : result});
    });
    function getCity(arg1, callback) {

        var url = "http://dataservice.accuweather.com/locations/v1/search?apikey=" + accApiKey + " &q=" + arg1;

        unirest.get(url)
            .end(function (response) {

                var cityCode = "";
                var data = response.body;

                if (data.length == 0) {
                    cityCode = "notfound";
                }
                else if (data.length > 1) {
                    cityCode = "toomany";
                }
                else if (data.length == 1) {
                    cityCode = data[0].Key;
                }

                console.log("getCity: " + arg1 + " code is " + cityCode);

                callback(null, cityCode);
            });

    }

    function get1dayForecast(arg2, callback) {

        var url = "http://dataservice.accuweather.com/indices/v1/daily/1day/" + arg2 + "/27?apikey=" + accApiKey;

        unirest.get(url)
            .end(function (response) {

                var migraineIndex = "";

                if(response.body.length==1) {

                    if (response.body[0].hasOwnProperty("Value")) {

                        console.log("get1dayForecast: Found Index " + response.body[0].Value + " for city code " + arg2);
                        migraineIndex = response.body[0].Value;
                    }
                    else {
                        console.log("get1dayForecast: Could not Index retrieve migraine index for city: " + arg2);
                    }
                }
                else
                {
                    migraineIndex="-1";
                }

                callback(null, migraineIndex)
            });
    }

});

// =============================================================================
// REGISTER OUR ROUTES
// =============================================================================
app.use('/api', router);

console.log('Port: ' + port);
app.listen(port);
console.log('API Magic happens on port ' + port);
