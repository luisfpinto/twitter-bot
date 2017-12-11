const { app } = require('./server')
const { request, split, filterUser } = require('./helper')

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
    console.log(user)
    res.send(user)
  })
  .catch(err => console.log({err}))
})

// Get Followers Id from a username
app.get('/followersId', (req, res) => {
  const name = user.name || 'twitter'
  request('GET', `https://api.twitter.com/1.1/followers/ids.json?cursor=-1&screen_name=${name}&count=${user.followers}`)
  .then(response => {
    followers.ids = split(response.data.ids) // Here we have arrays of 100 users.
    res.send(followers.ids)
  })
  .catch(err => console.log({err}))
})

// Check if a user is good or not to follow. This will only accepts a maximum of 100 users
app.get('/usersLookup', (req, res) => {
  const userName = 'twitter'
  const filter = 'hard'
  request('GET', `https://api.twitter.com/1.1/users/lookup.json?screen_name=${userName}`)
  .then(response => {
    console.log('User filtered', filterUser(response.data[0], filter))
    res.send(response.data)
  })
  .catch(err => console.log({err}))
})
