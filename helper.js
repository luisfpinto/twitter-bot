const axios = require('axios')
const { ACCESS_TOKEN } = require('./config')

const request = function (method = 'GET', url = '') {
  // console.log('Doing Request')
  return new Promise((resolve, reject) => {
    axios({
      method,
      url,
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    })
    .then(data => {
      resolve(data)
    })
    .catch(err => reject(err))
  })
}

// This function will split the number of users in a few array of 100users. This is because to get userinfo you can only do get a request for up to 100 users.
function split (userIds) {
  const length = userIds.length
  let followers = [] // Here I'll an array of users split every 100
  let users = []
  for (var i = 0; i < length; i++) {
    if (i % 100 !== 0 || i === 0) {
      users.push(userIds[i])
     // console.log(users)
    } else {
      followers.push(users)
      users = []
    }
  }
  if (users.length !== 0) followers.push(users)
  return followers
}

// This function will filter users based on a filer. If it doesn't pass the filter it will return false, otherwise true.
function filterUser (users, filter) {
  if (!filter) return users
  console.log('Filtering Users')
  let usersFiltered = users.map(user => {
    const {description, default_profile_image, statuses_count,
      followers_count, friends_count} = user
    let penalty = 0
    if (description === '') penalty++
    if (default_profile_image === true) penalty++
    if (statuses_count < 50) penalty++
    if (followers_count < 20) penalty++
    if (friends_count < 150) penalty++
    switch (filter) {
      case 'soft':
        if (penalty >= 4) return null
        else return user
      case 'medium':
        if (penalty >= 3) return null
        else return user
      case 'hard':
        if (penalty >= 1) return null
        else return user
      default:
        return user
    }
  }).filter(r => !r)
  console.log('USERS FILTERED LENGTH', usersFiltered.length)
  return usersFiltered
}

function matchIds (following, followers) {
  let found = false
  let noFollowers = []
  following.map(followingUser => {
    followers.map((followerUser, index) => {
      if (followingUser.id_str === followerUser) found = true
      if (index + 1 === followers.length && !found) noFollowers.push(followingUser.id_str)
    })
  })
  return noFollowers
}

module.exports = {request, split, filterUser, matchIds}
