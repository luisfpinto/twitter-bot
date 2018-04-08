const express = require('express')
var session = require('express-session')
const app = express()
var bodyParser = require('body-parser')

const { router } = require('./api/authentication')
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
app.use(bodyParser.urlencoded({ extended: true }))

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})

let twitterUser

app.post('/follow', (req, res) => {
  console.log('-------------****************-------------')
  let user = req.body.user
  let filter = req.body.filter
  let realUser = req.body.userName
  if (req.session.oauthAccessToken) {
    twitterUser = new User(user, filter, realUser)
    twitterUser.getUser()
    .then(data => {
      console.log('User', data.userName)
      console.log('Number of followers', data.numFollowers)
      console.log('Followers', data.followingList.length)
      console.log('NumofFollowersRAW', data.followingListRaw.length)
      console.log('Filtered followers', data.followingList.length)
      twitterUser.follow(data.followingList, req.session.oauthAccessToken, req.session.oauthAccessTokenSecret)
      res.status(200)
    })
    .catch(err => {
      console.log(err)
      res.status(500).send(`Error in the request. See status on the server for more info`)
    })
  } else {
    console.log('Hey')
    res.status(500).send('User not logged in')
  }
})

app.post('/unfollow', (req, res) => {
  if (req.session.oauthAccessToken) {
    let twitterUser = new User(req.body.user, req.body.filter, req.body.userName)
    twitterUser.getUser()
    .then(() => {
      twitterUser.unfollow(req.session.oauthAccessToken, req.session.oauthAccessTokenSecret)
      res.status(200)
    })
    .catch(err => console.log(err))
  } else {
    res.status(500).send('User not logged in')
  }
})

app.use('*', (req, res) => {
  res.send('Forbidden')
})

module.exports = { app }