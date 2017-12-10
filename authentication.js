const express = require('express')
var router = express.Router()
const OAuth = require('oauth').OAuth
const axios = require('axios')
const randomstring = require('randomstring')
const { API_KEY, API_SECRET, callbackURL, API_SECRET_64 } = require('./config')

// This function allow us to authenticate a twitter user using Oauth
const oAuth = new OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  API_KEY,
  API_SECRET,
  '1.0',
  callbackURL,
  'HMAC-SHA1'
)

router.get('/login', (req, res) => {
  oAuth.get('https://api.twitter.com/1.1/account/verify_credentials.json', req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, (error, data, response) => {
    if (error) { // There will be an error if the user is not logged in
      console.log(error)
      res.redirect('/auth/connect')
    } else {
      console.log('Already signed in')
      res.send({userLogged: true})
    }
  })
})

// Function to login twitter user using OAuth
router.get('/connect', (req, res) => {
  console.log('Connecting to Twitter')
  oAuth.getOAuthRequestToken((error, oauthToken, oauthTokenSecret) => {
    if (error) {
      res.send(error)
    } else {
      req.session.oauthRequestToken = oauthToken
      req.session.oauthRequestTokenSecret = oauthTokenSecret
      res.send({url: `https://twitter.com/oauth/authorize?oauth_token=${req.session.oauthRequestToken}`})
    }
  })
})

// Callback url. This is set in the app setting of the twitter web dashboard
router.get('/callback', function (req, res) {
  console.log('Successfully Logged in Twitter')
  oAuth.getOAuthAccessToken(req.session.oauthRequestToken, req.session.oauthRequestTokenSecret, req.query.oauth_verifier, (error, oauthAccessToken, oauthAccessTokenSecret) => {
    if (error) {
      res.send(error)
    } else {
      req.session.oauthAccessToken = oauthAccessToken
      req.session.oauthAccessTokenSecret = oauthAccessTokenSecret
      res.redirect('/follow')
    }
  })
})

router.get('/signature', (req, res) => {
  console.log('Getting signature')
  // const oauthNonce = randomstring.generate().toString('base64') // this must be a radom string
  // const timestamp = Date.now()
  // const signatureConfig = [`include_entities=true&oauth_consumer_key="${API_KEY}"&oauth_nonce="${oauthNonce}"&oauth_signature_method="HMAC-SHA1"&oauth_timestamp ="${timestamp}"&oauth_token ="${req.session.oauthAccessToken}"&oauth_version="1.0"`]
  // console.log(signatureConfig)
  // axios({
  //   method: 'POST',
  //   url: `https://api.twitter.com/1.1/statuses/update.json`,
  //   headers: {
  //     'Authorization': `OAuth ${signatureConfig}`
  //   }
  // })
  // .then(response => {
  //   console.log('Sucess')
  //   console.log(response.data)
  // })
  // .catch(err => res.send(err.response.data))
})

// Get the access token
router.get('/getAccessToken', (req, res) => {
  console.log('Authorizing')
  console.log(API_SECRET_64)
  axios({
    method: 'POST',
    url: 'https://api.twitter.com/oauth2/token',
    headers: {
      'Authorization': `Basic ${API_SECRET_64}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
    params: {
      'grant_type': 'client_credentials'
    }
  })
  .then(data => {
    res.send(data.data['access_token'])
  })
  .catch(err => console.log(err.response))
})

module.exports = { router, oAuth }
