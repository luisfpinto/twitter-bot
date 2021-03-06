const express = require('express')
var auth = express.Router()
const OAuth = require('oauth').OAuth
const axios = require('axios')
const { API_KEY, API_SECRET, callbackURL, API_SECRET_64 } = require('../config')

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

auth.get('/login', (req, res) => {
  oAuth.get('https://api.twitter.com/1.1/account/verify_credentials.json', req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, (error, data, response) => {
    if (error) { // There will be an error if the user is not logged in
      res.redirect('/auth/connect')
    } else {
      console.log('Already signed in')
      res.send({userLogged: true})
    }
  })
})

// Function to login twitter user using OAuth
auth.get('/connect', (req, res) => {
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
auth.get('/callback', function (req, res) {
  console.log('Successfully Logged in Twitter-Bot')
  oAuth.getOAuthAccessToken(req.session.oauthRequestToken, req.session.oauthRequestTokenSecret, req.query.oauth_verifier, (error, oauthAccessToken, oauthAccessTokenSecret) => {
    if (error) {
      res.send(error)
    } else {
      req.session.oauthAccessToken = oauthAccessToken
      req.session.oauthAccessTokenSecret = oauthAccessTokenSecret
      getUserInfo(oauthAccessToken, oauthAccessTokenSecret)
      .then((userInfo) => {
        req.session.userInfo = userInfo
        return res.redirect(`/?name=${userInfo.realUserName}&id=${userInfo.realUserId}`)
      })
      .catch(() => res.send(error))
    }
  })
})

// Get the access token
auth.get('/getAccessToken', (req, res) => {
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

// Get user info that did the oAuth process
function getUserInfo (oauthAccessToken, oauthAccessTokenSecret) {
  return new Promise((resolve, reject) => {
    oAuth.get('https://api.twitter.com/1.1/account/verify_credentials.json', oauthAccessToken, oauthAccessTokenSecret, (error, data, response) => {
      if (error) { // There will be an error if the user is not logged in
        console.log('ERRRR', error)
        return reject(error)
      } else {
        const response = JSON.parse(data)
        const userInfo = { realUserName: response.screen_name, realUserId: response.id_str }
        return resolve(userInfo)
      }
    })
  })
}

module.exports = { auth, oAuth }
