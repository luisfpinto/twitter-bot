const axios = require('axios')
const express = require('express')
const app = express()

const { PORT, API_SECRET_64 } = require('./config')
const { request, split, filterUser } = require('./helper')

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})

let user = {} // Here is where we store the information about the user I'm looking for
let followers = {} // Here is where we store the information about the user's followers

// Get the access token
app.get('/authorize', (req, res) => {
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

// Find anything related with a query {data}
app.get('/find', (req, res) => {
  const query = req.params.data || 'twitter'
  request('GET', `https://api.twitter.com/1.1/search/tweets.json?q=%23${query}&result_type=recent`)
  .then(response => {
    console.log(response)
  })
  .catch(err => console.log({err}))
})

// Get the userId of {user}
app.get('/userId', (req, res) => {
  const name = req.params.user || 'twitter'
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

app.get('/followersId', (req, res) => {
  const name = user.name || 'twitter'
  request('GET', `https://api.twitter.com/1.1/followers/ids.json?cursor=-1&screen_name=${name}&count=${user.followers}`)
  .then(response => {
    followers.ids = split(response.data.ids) // Here we have arrays of 100 users.
    res.send(followers.ids)
  })
  .catch(err => console.log({err}))
})

app.get('/usersLookup', (req, res) => {
  /* Filters for a good user
    response.data.description !== ''
    default_profile_image !== true
    statuses_count !== 0
    followers_count !== 0
    friends_count !== 0
  */
  const userName = 'twitter'
  const filter = 'hard'
  request('GET', `https://api.twitter.com/1.1/users/lookup.json?screen_name=${userName}`)
  .then(response => {
    console.log('User filtered', filterUser(response.data[0], filter))
    // console.log(response.data)
    res.send(response.data)
  })
  .catch(err => console.log({err}))
})

app.get('/follow', (req, res) => {
  const userId = 783214
  request('POST', `https://api.twitter.com/1.1/friendships/create.json?user_id=${userId}&follow=true`)
  .then(response => {
    console.log('User followed', userId)
    console.log(response.data)
    res.send(response.data)
  })
  .catch(err => console.log(err.response.data))
})
