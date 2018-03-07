const { request, filterUser } = require('./helper')
const { oAuth } = require('./api/authentication')
const Promise = require('bluebird')
var fs = require('fs')

let user
let cursor = -1 // we use this variable for the checkFollowers function to go through all our users see more https://developer.twitter.com/en/docs/basics/cursoring checkFollowers()
let maxGetRequest = 15 // Maximum number of requests in 15 minutes

class User {
  constructor (userName, filter) {
    this.userName = userName
    this.filter = filter
  }

  // This function will manage all the process to get the followers of an account
  async getUser () {
    try {
      user = await this.getUserInfo()
      await this.createOrRetrieve()
      console.log('BIMBA')
      return user
    } catch (err) {
      throw err
    }
  }

  // This function provides the whole information we want to get the followers from
  getUserInfo () {
    console.log('Getting user info')
    return new Promise((resolve, reject) => {
      request('GET', `https://api.twitter.com/1.1/users/lookup.json?screen_name=${this.userName}`)
      .then(response => {
        maxGetRequest--
        return resolve({
          userName: this.userName,
          userId: response.data[0].id_str,
          numFollowers: response.data[0].followers_count
        })
      })
      .catch(err => reject(err))
    })
  }

  createOrRetrieve () {
    return new Promise((resolve, reject) => {
      fs.stat(`./data/${user.userName}`, async (stat, error) => {
        if (stat !== null) { // There aren't any filet yet
          user.followers = await this.checkFollowers('hard')
          fs.writeFile(`./data/${user.userName}`, JSON.stringify(user), 'utf8')
          return resolve()
        } else {
          user = JSON.parse(fs.readFileSync(`./data/${user.userName}`, 'utf8'))
          return resolve()
        }
      })
    })
  }

  // This function will get all the followers information and it will return an array of 100 users arrays. Limited to 5000 Followers. Need to use cursoring
  checkFollowers () {
    console.log('Checking followers')
    return new Promise((resolve, reject) => {
      console.log('Checking follower in Promise')
      request('GET', `https://api.twitter.com/1.1/followers/list.json?cursor=${cursor}&screen_name=${this.userName}`)
      .then(response => {
        maxGetRequest--
        if (response.data['next_cursor'] === 0) {
          if (!user.followersRaw) user.followersRaw = response.data.users
          else user.followersRaw.push.apply(user.followersRaw, response.data.users)
          const filterUserd = filterUser(user.followersRaw, this.filter)
          return resolve(filterUserd)
        } else {
          console.log(maxGetRequest)
          cursor === -1 ? user.followersRaw = response.data.users : user.followersRaw.push.apply(user.followersRaw, response.data.users)
          cursor = response.data['next_cursor']
          console.log(user.followersRaw.length)
          let delay = 1000
          if (maxGetRequest === 0) {
            delay = 900000
            maxGetRequest = 15
          }
          return Promise.delay(delay).then(() => resolve(this.checkFollowers(cursor)))
        }
      })
      .catch(err => {
        console.log('ERRRRR on CheckFollowers', err)
        reject(err)
      })
    })
  }

  async follow (users, oauthAccessToken, oauthAccessTokenSecret) {
    console.log('Following')
    await users.map(async (user, index) => {
      try {
        await Promise.delay(36000 * (index + 1))
        await this.followOneUser(user.id_str, oauthAccessToken, oauthAccessTokenSecret)
      } catch (error) {
        console.log(error)
      }
    })
  }

  followOneUser (userId, oauthAccessToken, oauthAccessTokenSecret) {
    return new Promise((resolve, reject) => {
      oAuth.post('https://api.twitter.com/1.1/friendships/create.json', oauthAccessToken, oauthAccessTokenSecret, {user_id: userId, follow: true}, (error, data, response) => {
        if (error) { // There will be an error if the user is not logged in
          reject(error)
        } else {
          var dataJson = JSON.parse(data)
          console.log(`Following user${dataJson.screen_name}`)
          if (dataJson.following === true) console.log(`Already following user${dataJson.screen_name}`)
          return resolve()
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
