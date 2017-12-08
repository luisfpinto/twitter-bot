const axios = require('axios')
const { ACCESS_TOKEN } = require('./config')
var example = require('./example')

const request = function (method = 'GET', url = '') {
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
function filterUser (user, filter) {
  const {description, default_profile_image, statuses_count,
  followers_count, friends_count} = user
  let penalty = 0
  if (description === '') penalty++
  if (default_profile_image === true) penalty++
  if (statuses_count < 100) penalty++
  if (followers_count < 20) penalty++
  if (friends_count < 200) penalty++

  switch (filter) {
    case 'soft':
      if (penalty >= 4) return false
      break
    case 'medium':
      if (penalty >= 3) return false
      break
    case 'hard':
      if (penalty >= 1) return false
      break
    default:
      return true
  }
}

module.exports = {request, split, filterUser}
