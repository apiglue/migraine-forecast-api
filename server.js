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
        async.apply(getCity, cityName), get5dayForecast
    ], function (err, result) {
        res.json({migraineIndex: result});
    });

    function getCity(arg1, callback) {

        var url = "http://dataservice.accuweather.com/locations/v1/search?apikey=" + accApiKey + "&q=" + arg1;

        console.log("City URL: " + url);

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


    function get5dayForecast(arg2, callback) {

        var url = "http://dataservice.accuweather.com/indices/v1/daily/5day/" + arg2 + "/27?apikey=" + accApiKey;
        var results = {
            forecast: []
        };
        var current_date = new Date();
        var daysOfWeek = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

        console.log("Forecast URL: " + url);

        unirest.get(url)
            .end(function (response) {

                if (response.body.length >= 1) {
                    for (i = 0; i < response.body.length; i++) {
                        if (response.body[i].hasOwnProperty("Value")) {
                            var item = response.body[i];
                            results.forecast.push({
                                "forecastDay": item.LocalDateTime,
                                "forecastDayOfWeek":current_date.getDay(),
                                "forecastDayOfWeekName":daysOfWeek[current_date.getDay()],
                                "migraineindex": item.Value,
                                "migrainedescription": item.Category
                            });

                            current_date.setDate(current_date.getDate() + 1);
                        }
                        else {
                            console.log("get5dayForecast: Could not Index retrieve migraine index for city: " + arg2);
                        }

                    }
                }
                callback(null, results)
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
