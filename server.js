const express = require('express')
var session = require('express-session')
const app = express()
const { router, oAuth } = require('./authentication')

const { PORT, secret } = require('./config')
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

module.exports = { app }
