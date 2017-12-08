const express = require('express')
var session = require('express-session')
const app = express()
const auth = require('./authentication')
const axios = require('axios')
var randomstring = require("randomstring")

const { PORT, secret, API_KEY, ACCESS_TOKEN } = require('./config')
const { request, split, filterUser } = require('./helper')

app.use(session({
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set this to false to allow using non https hosts
}))

app.use('/auth', auth)
app.use(express.static('public'))

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})

let user = {} // Here is where we store the information about the user I'm looking for
let followers = {} // Here is where we store the information about the user's followers

app.use('*', (req, res) => {
  res.send('Forbidden')
})

// Get the userId of {user}
app.get('/userId', (req, res) => {
  const name = req.params.user || 'twitter'
  request('GET', `https://api.twitter.com/1.1/users/lookup.json?screen_name=${name}`)
  .then(response => {
    user = {
      name,
      userId: response.data[0].id_str,
      followers: response.data[0].followers_count
    }
    console.log(user)
    res.send(user)
  })
  .catch(err => console.log({err}))
})

// Get Followers Id from a username
app.get('/followersId', (req, res) => {
  const name = user.name || 'twitter'
  request('GET', `https://api.twitter.com/1.1/followers/ids.json?cursor=-1&screen_name=${name}&count=${user.followers}`)
  .then(response => {
    followers.ids = split(response.data.ids) // Here we have arrays of 100 users.
    res.send(followers.ids)
  })
  .catch(err => console.log({err}))
})

// Check if a user is good or not to follow
app.get('/usersLookup', (req, res) => {
  const userName = 'twitter'
  const filter = 'hard'
  request('GET', `https://api.twitter.com/1.1/users/lookup.json?screen_name=${userName}`)
  .then(response => {
    console.log('User filtered', filterUser(response.data[0], filter))
    // console.log(response.data)
    res.send(response.data)
  })
  .catch(err => console.log({err}))
})

// Follow a user by userId
// app.get('/follow', (req, res) => {
//   const userId = 783214
//   request('POST', `https://api.twitter.com/1.1/friendships/create.json?user_id=${userId}&follow=true`)
//   .then(response => {
//     console.log('User followed', userId)
//     console.log(response.data)
//     res.send(response.data)
//   })
//   .catch(err => console.log(err.response.data))
// })

app.get('/follow', (req, res) => {
  const userId = 783214
  const oauthNonce = randomstring.generate().toString('base64') // this must be a radom string
  const timestamp = Date.now()
  const OAuthConfig = [
    `OAuth oauth_consumer_key= ${API_KEY}`,
    `oauth_nonce= ${oauthNonce}`,
    `oauth_signature = `, // missing this
    'oauth_signature_method=HMAC-SHA1',
    `oauth_timestamp = ${timestamp}`,
    `oauth_token = ${req.session.oauthAccessToken}`,
    'oauth_version=1.0'
  ]

  axios({
    method: 'POST',
    url: `https://api.twitter.com/1.1/friendships/create.json?user_id=${userId}&follow=true`,
    headers: {
      'Authorization': `OAuth ${OAuthConfig}`
    }
  })
  .then(data => {
    console.log('Sucess')
    console.log(data)
  })
  .catch(err => console.log(err))
})
