const express = require('express')
var user = express.Router()
const { User } = require('../user')

let twitterUser

// Request Session Token to access these routes
function requestSession (req, res, next) {
  if (!req.session.oauthAccessToken) return res.end('User not logged in')
  next()
}
user.use(requestSession)

user.get('/getUserInfo', (req, res) => {
  const user = req.query.user
  const {realUserName, realUserId} = req.session.userInfo
  twitterUser = new User(realUserName, realUserId, user)
  twitterUser.getUserInfo()
  .then(data => res.send({data}))
  .catch(err => res.send({err}))
})

user.get('/getFollowingList', (req, res) => {
  console.log('Getting Following List')
  twitterUser.createOrRetrieveFollowersList()
  .then((followingListRaw) => {
    console.log(followingListRaw.length)
    res.send({followingListRaw})
  })
  .catch(err => res.send(err))
})

user.post('/filter', (req, res) => {
  console.log('Filtering UserList')
  const filters = req.body.filters  // This must be {filter: 'soft', 'medium' or 'hard', keyword: 'keyword'}
  const followingListFiltered = twitterUser.filterList(filters)
  console.log('FollowingListFiltered', followingListFiltered.length)
  res.send(followingListFiltered)
})

user.post('/follow', (req, res) => {
  const range = req.body.range
  console.log('Following Users with range', range)
  const {oauthAccessToken, oauthAccessTokenSecret} = req.session
  twitterUser.updateList() // Test Update List
  .then(users => twitterUser.follow(oauthAccessToken, oauthAccessTokenSecret, users, range)) // Check if this returns a promise or not
  .then(() => res.send('OK'))
  .catch(err => res.send(err))
})

user.post('/unfollow', (req, res) => {

})

module.exports = { user }