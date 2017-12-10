const express = require('express')
var session = require('express-session')
const app = express()
const { router, oAuth } = require('./authentication')

const { PORT, secret } = require('./config')
const { request, split, filterUser } = require('./helper')
const { User } = require('./user')

app.use(session({
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set this to false to allow using non https hosts
}))

app.use('/auth', router)
app.use(express.static('public'))

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})

let user = {} // Here is where we store the information about the user I'm looking for
let followers = {} // Here is where we store the information about the user's followers

// Get the userId of {user}
app.get('/userId', (req, res) => {
  const name = req.params.user || 'twitter'
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
    res.send(response.data)
  })
  .catch(err => console.log({err}))
})

// Follow a user by userId

app.get('/follow', (req, res) => {
  const params = {
    user_id: '783214'
  }
  oAuth.post('https://api.twitter.com/1.1/friendships/create.json', req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, params, (error, data, response) => {
    if (error) { // There will be an error if the user is not logged in
      console.log(error)
      res.send(error)
    } else {
      var dataJson = JSON.parse(data)
      if (dataJson.following === true) {
        console.log(`Following user${dataJson.screen_name}`)
        res.send(`Following ${dataJson.screen_name}`)
      }
    }
  })
})

app.use('*', (req, res) => {
  res.send('Forbidden')
})

let twitterUser = new User('luisfpinto_', 'soft')
twitterUser.getUser()
.then(data => console.log('Finishing'))
.catch(err => console.log(err.response.data))
