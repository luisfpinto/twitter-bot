/*
In case you want to do this using an api here you have all the endopoints
*/

const { app } = require('../server')
const { request, split, filterUser } = require('../helper')
const { oAuth } = require('./authentication')

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
    res.send(user)
  })
  .catch(err => console.log({err}))
})

// Get Followers Id from a username
app.get('/followersId', (req, res) => {
  const name = req.params.name || 'twitter'
  request('GET', `https://api.twitter.com/1.1/followers/ids.json?cursor=-1&screen_name=${name}&count=${user.followers}`)
  .then(response => {
    followers = split(response.data.ids) // Here we have arrays of 100 users.
    res.send(followers)
  })
  .catch(err => console.log({err}))
})

// Check if a user is good or not to follow. This will only accepts a maximum of 100 users
app.get('/usersLookup', (req, res) => {
  const userName = req.params.followers || 'twitter' // This can be an array of 100 users. See /follwoersId & split functio
  const filter = req.params.filter
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
