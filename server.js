const express = require('express')
var session = require('express-session')
const app = express()
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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})

app.get('/follow', (req, res) => {
  if (req.session.oauthAccessToken) {
    let twitterUser = new User('luisfpinto_')
    twitterUser.getUser()
    .then(data => {
      console.log('User', data.userName)
      console.log('Number of followers', data.numFollowers)
      console.log('Filtered followers', data.filteredFollowers.length)
      twitterUser.follow('783214', req.session.oauthAccessToken, req.session.oauthAccessTokenSecret)
      .then(res.send())
    })
    .catch(err => console.log(err.response.data))
  } else {
    res.status(500).send('User not logged in')
  }
})

app.use('*', (req, res) => {
  res.send('Forbidden')
})

module.exports = { app }
