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

// This function will split the number of users in a few array of 100users. This is because to get userinfo you can only do get request for up to 100 users.
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

// function filter (user, filter) {
//   switch (filter) {
//     case 'soft':
//      if()
//   }
// }

module.exports = {request, split, filter}
