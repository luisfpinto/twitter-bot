const axios = require('axios')
const { ACCESS_TOKEN } = require('./config')
var fs = require('fs')

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

 // function that will get the information about the API request limits status
function checkApiStatus () {
  return new Promise((resolve, reject) => {
    request('GET', `https://api.twitter.com/1.1/application/rate_limit_status.json?resources=followers`)
    .then(response => {
      let data = response.data.resources.followers['/followers/list']
      return resolve({
        limit: data.limit,
        remaining: data.remaining,
        reset: data.reset
      })
    })
    .catch(err => reject(err))
  })
}

// This function will filter users based on a filter. If it doesn't pass the filter it will return false, otherwise true.
function filterUsers (users, filters) {
  const {filter, keyword} = filters
  if (!filters) return users
  let usersFiltered = users.map(user => {
    const {description, default_profile_image, statuses_count,
      followers_count, friends_count} = user

    // If user description doesn't contain the keyword then return null
    if (keyword && !description.includes(keyword)) return null

    // Check Penalty
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
  }).filter(r => !!r)
  return usersFiltered
}

// Check weather a user is following us or not
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

// Save user in a file once I follow him
function saveFollowedUser (userName, followedUser) {
  console.log('Saving Follower', followedUser)
  fs.stat(`./data/${userName}_followList`, async (stat, error) => {
    if (stat !== null) { // There aren't any filet yet
      fs.writeFile(`./data/${userName}_followList`, JSON.stringify({followedUsers: [followedUser]}), 'utf8')
    } else {
      let followedUsers = JSON.parse(fs.readFileSync(`./data/${userName}_followList`, 'utf8')).followedUsers
      console.log(followedUsers)
      followedUsers.push(followedUser)
      fs.writeFile(`./data/${userName}_followList`, JSON.stringify({followedUsers}), 'utf8')
    }
  })
}

// Funtion that will update the followList based on users we've already followed
function updateListToFollow (followingList, ListToPopUp) {
  return followingList.filter(userToFollow => {
    return !ListToPopUp.some(followedUser => {
      return (followedUser === userToFollow.id_str)
    })
  })
}
module.exports = {request, filterUsers, matchIds, saveFollowedUser, updateListToFollow, checkApiStatus}

// Testing Purposes for the moment until I do some automatic tests
// const users = JSON.parse(fs.readFileSync(`./data/XXXXX`, 'utf8')).followingListRaw
// const filteredUsers = filterUsers(users, {filter: 'hard', keyword: 'H'})
// console.log(filteredUsers.length, users.length)
// console.log(updateListToFollow('luisfpinto_', ['123', "790456137133031425","790456137133031425","882876837323517952","922367579347406848","860393317456117761","2790935251"]))