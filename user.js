const { request, split, filterUser } = require('./helper')
const { oAuth } = require('./api/authentication')
let user = {}

class User {
  constructor (userName, filter) {
    this.userName = userName
    this.filter = filter
  }

  // This function will manage all the process to get the followers of an account
  async getUser () {
    try {
      console.log('Filter', this.filter)
      user = await this.getUserInfo(this.username)
      user.followers = await this.checkFollowers()
      user.filteredFollowers = await this.filterFollowers(this.filter, user.followers)
      return user
    } catch (error) {
      throw error
    }
  }

  // This function provides the whole information we want to get the followers from
  getUserInfo () {
    console.log('Getting user info')
    return new Promise((resolve, reject) => {
      request('GET', `https://api.twitter.com/1.1/users/lookup.json?screen_name=${this.userName}`)
      .then(response => {
        return resolve({
          userName: this.userName,
          userId: response.data[0].id_str,
          numFollowers: response.data[0].followers_count
        })
      })
      .catch(err => reject(err))
    })
  }

  // This function will get all the followers information
  checkFollowers () {
    console.log('Checking followers')
    return new Promise((resolve, reject) => {
      request('GET', `https://api.twitter.com/1.1/followers/ids.json?cursor=-1&screen_name=${this.userName}&count=${this.numFollowers}`)
      .then(response => {
        let followers = split(response.data.ids)
        return resolve(followers)
      })
      .catch(err => reject(err))
    })
  }

  // This function will filter the followers of an account based on a filter
  filterFollowers (filter, followers) {
    console.log('Filtering Followers')
    let responseIndex = 0
    return new Promise((resolve, reject) => {
      let filteredUsers = []
      followers.map((oneHundredFollowers, index) => {
        request('GET', `https://api.twitter.com/1.1/users/lookup.json?user_id=${oneHundredFollowers}`)
        .then(response => {
          responseIndex = responseIndex + 1
          response.data.map(user => {
            if (filterUser(user, this.filter) && this.filter !== undefined) { // If filter is undefined then all followers are in the filtered followers list
              filteredUsers.push(user.id_str)
            } else if (this.filter === undefined) {
              filteredUsers.push(user.id_str)
            }
          })
          if (responseIndex === followers.length) return resolve(filteredUsers)
        })
        .catch(err => {
          console.log(err)
          reject(err)
        })
      })
    })
  }

  follow (userId, oauthAccessToken, oauthAccessTokenSecret) {
    return new Promise((resolve, reject) => {
      oAuth.post('https://api.twitter.com/1.1/friendships/create.json', oauthAccessToken, oauthAccessTokenSecret, {user_id: userId, follow: true}, (error, data, response) => {
        if (error) { // There will be an error if the user is not logged in
          console.log(error)
          reject(error)
        } else {
          var dataJson = JSON.parse(data)
          console.log(`Following user${dataJson.screen_name}`)
          if (dataJson.following === true) {
            console.log(`Already following user${dataJson.screen_name}`)
            resolve()
          }
        }
      })
    })
  }

  unfollow (userId, oauthAccessToken, oauthAccessTokenSecret) {
    return new Promise((resolve, reject) => {
      oAuth.post('https://api.twitter.com/1.1/friendships/destroy.json', oauthAccessToken, oauthAccessTokenSecret, {user_id: userId}, (error, data, response) => {
        if (error) { // There will be an error if the user is not logged in
          console.log(error)
          reject(error)
        } else {
          var dataJson = JSON.parse(data)
          console.log(`Unfollowing user${dataJson.screen_name}`)
        }
      })
    })
  }
}

module.exports = { User }
