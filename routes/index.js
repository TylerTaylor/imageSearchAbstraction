var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var dbUrl;
mongoose.connect('localhost:27017/recentSearches');
var Schema = mongoose.Schema;
var https = require('https')
var search_controller = require('../controllers/searchController')

var recentSearchSchema = new Schema({
  term: String,
  when: String
})

var RecentSearch = mongoose.model('RecentSearch', recentSearchSchema)

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Image Search Abstraction Layer' });
});

/* GET image search results */

var baseUrl = "https://www.googleapis.com/customsearch/v1?"
var cx = process.env.CSE_CX
var key = process.env.CSE_KEY
var apiUrl = baseUrl + "cx=" + cx + "&key=" + key + "&q="

const request = require('request')

router.get('/latest', (req, res) => {
  RecentSearch.find({}, {_id: 0, __v: 0}, (err, data) => {
    res.json(data)
  })
})

router.get('/destroy', (req, res) => {
  RecentSearch.remove({}, (err, data) => {
    res.redirect('/bacon')
  })
})

router.get('/testing', search_controller.search_testing)

router.get('/:query*', (req, res) => {
  var queryParam = req.params.query
  var { offset } = req.query

  var saveSearchTerm = new RecentSearch({
    term: queryParam,
    when: new Date()
  })

  saveSearchTerm.save()

  if (offset) {
    var query = apiUrl + queryParam + "&searchType=image&start=" + offset
    sendRequest(query)
  } else {
    var query = apiUrl + queryParam + "&searchType=image"
    sendRequest(query)
  }

  function sendRequest(query) {
    request(query, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        let queryResults = JSON.parse(body)
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
  } // end sendRequest
})

module.exports = router;
