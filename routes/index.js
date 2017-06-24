var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var dbUrl;
mongoose.connect('localhost:27017/recent');
var Schema = mongoose.Schema;
var https = require('https')

var recentSearchSchema = new Schema({
  term: String,
  when: String
}, {collection: 'recent-searches'})

var RecentSearches = mongoose.model('RecentSearches', recentSearchSchema)

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Image Search Abstraction Layer' });
});

/* GET image search results */

// url needs to look like:
// cx=005742952710332006665:ta9gorrwldk&key=AIzaSyBmo-lExo3CBn5fgPcdfiA4hqQ6AI9x3jY&q=bacon&searchType=image

var baseUrl = "https://www.googleapis.com/customsearch/v1?"
var cx = process.env.CSE_CX
var key = process.env.CSE_KEY
var apiUrl = baseUrl + "cx=" + cx + "&key=" + key + "&q="

const request = require('request')

router.get('/:query', (req, res) => {
  var queryParam = req.params.query

  var query = apiUrl + queryParam + "&searchType=image"

  request(query, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      let queryResults = JSON.parse(body)

      // for each item in results['items'] we need to grab:
      //  - link / url
      //  - snippet
      //  - thumbnail
      //  - context link

      let results = []
      queryResults = queryResults['items']

      for (var i=0; i < queryResults.length; i++) {
        let obj = {
          url: queryResults[i]['link'],
          snippet: queryResults[i]['snippet'],
          thumbnail: queryResults[i]['image']['thumbnailLink'],
          context: queryResults[i]['image']['contextLink']
        }

        results.push(obj)
      }


      res.json(results)
    } else {
      console.log("Got an error: ", error, ", status code: ", response.statusCode)
    }
  })

  // res.redirect('/')

})

module.exports = router;
