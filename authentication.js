const express = require('express')
var router = express.Router()
const { oAuth } = require('./helper')

// Function to login twitter user using OAuth
router.get('/login', (req, res) => {
  oAuth.getOAuthRequestToken((error, oauthToken, oauthTokenSecret) => {
    if (error) {
      res.send(error)
    } else {
      req.session.oauthRequestToken = oauthToken
      req.session.oauthRequestTokenSecret = oauthTokenSecret
      console.log(req.session)
      res.redirect(`https://twitter.com/oauth/authorize?oauth_token=${req.session.oauthRequestToken}`)
    }
  })
})

router.get('/callback', function (req, res) {
  console.log(req.session)
  console.log(req.session.oauthRequestToken)
  console.log(req.session.oauthRequestTokenSecret)
  console.log(req.query.oauth_verifier)

  oAuth.getOAuthAccessToken(req.session.oauthRequestToken, req.session.oauthRequestTokenSecret, req.query.oauth_verifier, (error, oauthAccessToken, oauthAccessTokenSecret) => {
    if (error) {
      res.send(error)
    } else {
      req.session.oauthAccessToken = oauthAccessToken
      req.session.oauthAccessTokenSecret = oauthAccessTokenSecret
    }
  })
})

module.exports = router
