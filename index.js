require('dotenv').config()
const path = require('path')
const express = require('express')
const app = express()
const cons = require('consolidate')
const bodyParser = require('body-parser')
const Twitter = require('twitter')

app.engine('html', cons.nunjucks)
app.set('view engine', 'html')
app.set('views', path.join(__dirname, 'views'))
app.use('/public', express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))

const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
})

const handleData = event => {

  const { contributors, id_str, text } = event
  const isTweet = typeof contributors === 'object'
    && typeof id_str === 'string'
    && typeof text === 'string'
    
  console.log(isTweet && `${event['created_at']}: ${event.text}`.replace(/\s+/, ' '))
}

// const stream = client.stream('statuses/filter', {track: '#nra'})
// stream.on('data', handleData)




const query = {
  q: '',
  count: 100
}

const regex_url = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig
const regex_hashtag = /(#[a-z0-9]+)/ig

app.get('/', (req, res) => {
  res.send('Homepage')
})

app.get('/hashtag/:query', (req, res, next) => {
  query.q = req.params.query
  if (req.params.query[0] !== '#') {
    query.q = '#' + query.q
  }
  const cards = []
  let trends = []

  const tweets = client.get('search/tweets', query, (err, tweets, response) => {
    tweets.statuses.forEach(item => {
      if (!item.hasOwnProperty('retweeted_status') && item.entities.media){
        cards.push({
          media: item.entities.media[0],
          user: item.user,
          text: item.text
            .replace(regex_url, match => {
              return `<a href="${match}" target="_blank">${match}</a>`
            })
            .replace(regex_hashtag, match => {
              return `<a href="https://twitter.com/hashtag/${match.slice(1)}" target="_blank">${match}</a>`
            })
        })
      }
    })

    client.get('trends/place', { id: 23424977 }, (err, latest, response) => {
      trends = latest[0].trends
      
      res.render('index', {
        title: 'Twitter Testing',
        description: 'Call Twitter API with query and get images in response',
        author: 'Christopher McCormack',
        cards,
        trends,
        query: query.q
      })
    })
  })
})

app.post('/submit', (req, res) => {
  console.log('posted')
  console.log(req.body.search)

  if (req.body.search[0] === '#'){

    res.redirect(`/hashtag/${req.body.search}`)
  } else {
    res.redirect(`/${res.body.search}`)
  }

})

const server = app.listen(8080, ()=>{
  const {port, address} = server.address()
  console.log(`Connected to server ${address}:${port}`)
})