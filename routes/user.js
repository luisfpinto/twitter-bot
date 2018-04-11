const express = require('express')
var user = express.Router()
const { User } = require('../user')

let twitterUser

user.get('/getUserInfo', (req, res) => {
  console.log('Getting User info', req.query)
  const user = req.query.user
  if (req.session.oauthAccessToken) {
    const {realUserName, realUserId} = req.session.userInfo
    twitterUser = new User(realUserName, realUserId, user)
    twitterUser.getUserInfo()
    .then(data => {
      res.send({data})
    })
  } else {
    res.status(500).send('User not logged in')
  }
})

user.get('/followingList', (req, res) => {
  console.log('Getting Following List')
  const followingListRaw = twitterUser.createOrRetrieveFollowersList() // Change this to a promise
  console.log(followingListRaw)
  res.send({List: followingListRaw})
})

module.exports = { user }
