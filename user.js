const { request, filterUser, matchIds, saveFollowedUser } = require('./helper')
const { oAuth } = require('./api/authentication')
const Promise = require('bluebird')
var fs = require('fs')

let user // User info
let me // My account info
let cursor = -1 // we use this variable for the checkFollowers function to go through all our users see more https://developer.twitter.com/en/docs/basics/cursoring checkFollowers()
let rateLimitStatus

class User {
  constructor (userName, filter, realUserName, range) {
    this.realUserName = realUserName // Name of the original account (My account)
    this.userName = userName // Name of the friend we want to get the followers
    this.filter = filter
    this.range = range // Number of people to follow
  }

  // This function will manage all the process to get the followers of an account
  async getUser () {
    try {
      rateLimitStatus = await this.checkApiStatus()
      user = await this.getUserInfo(this.userName)
      me = await this.getUserInfo(this.realUserName)
      await this.createOrRetrieveFollowersList()
      return user
    } catch (err) {
      throw err
    }
  }

  // This function provides the whole information we want to get the followers from
  getUserInfo (user) {
    console.log('Getting user info')
    return new Promise((resolve, reject) => {
      request('GET', `https://api.twitter.com/1.1/users/lookup.json?screen_name=${user}`)
      .then(response => {
        rateLimitStatus.remaining--
        return resolve({
          userName: this.userName,
          userId: response.data[0].id_str,
          numFollowers: response.data[0].followers_count
        })
      })
      .catch(err => reject(err))
    })
  }

  createOrRetrieveFollowersList () {
    return new Promise((resolve, reject) => {
      fs.stat(`./data/${user.userName}`, async (stat, error) => {
        if (stat !== null) { // There aren't any filet yet
          user.followingList = await this.getFollowersList()
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
  getFollowersList () {
    console.log('Checking followers')
    return new Promise((resolve, reject) => {
      request('GET', `https://api.twitter.com/1.1/followers/list.json?cursor=${cursor}&screen_name=${this.userName}`)
      .then(response => {
        rateLimitStatus.remaining--
        if (response.data['next_cursor'] === 0) {
          if (!user.followingListRaw) user.followingListRaw = response.data.users
          else user.followingListRaw.push.apply(user.followingListRaw, response.data.users)
          const filterUserd = filterUser(user.followingListRaw, this.filter)
          return resolve(filterUserd)
        } else {
          console.log(rateLimitStatus.remaining)
          cursor === -1 ? user.followingListRaw = response.data.users : user.followingListRaw.push.apply(user.followingListRaw, response.data.users)
          cursor = response.data['next_cursor']
          console.log(user.followingListRaw.length)
          let delay = 0
          if (rateLimitStatus.remaining === 0) {
            delay = 900000
            rateLimitStatus.remaining = 30
          }
          return Promise.delay(delay).then(() => resolve(this.getFollowersList(cursor)))
        }
      })
      .catch(err => {
        console.log('ERR on getting followers List', err)
        fs.writeFile(`./data/${user.userName}`, JSON.stringify(user), 'utf8') // Save file in case of error
        reject(err)
      })
    })
  }

  getFollowersIds () {
    return new Promise((resolve, reject) => {
      console.log('Checking follower Ids')
      request('GET', `https://api.twitter.com/1.1/followers/ids.json?cursor=${cursor}&screen_name=${this.realUserName}`)
      .then(response => {
        rateLimitStatus.remaining--
        if (response.data['next_cursor'] === 0) {
          if (!user.followersIds) user.followersIds = response.data.ids
          else user.followersIds.push.apply(user.followersIds, response.data.ids)
          return resolve()
        } else {
          console.log(rateLimitStatus.remaining)
          console.log(user.followersIds)
          cursor === -1 ? user.followersIds = response.data.ids : user.followersIds.push.apply(user.followersIds, response.data.users)
          cursor = response.data['next_cursor']
          console.log(user.followersIds.length)
          let delay = 0
          if (rateLimitStatus.remaining === 0) {
            delay = 900000
            rateLimitStatus.remaining = 30
          }
          return Promise.delay(delay).then(() => resolve(this.getFollowersIds(cursor)))
        }
      })
      .catch(err => {
        console.log('ERRRRR on getting followers Ids', err)
        reject(err)
      })
    })
  }

  async follow (users, oauthAccessToken, oauthAccessTokenSecret) {
    console.log('Following')
    await users.map(async (user, index) => {
      try {
        if (this.range > 0 && user.id_str !== me.userId) { // Avoid following myself
          await Promise.delay(36000 * (index))
          await this.followOneUser(user.id_str, oauthAccessToken, oauthAccessTokenSecret)
          this.range -- // TRY THIS
        }
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
          saveFollowedUser(this.userName, dataJson.id_str)
          if (dataJson.following === true) console.log(`Already following user${dataJson.screen_name}`)
          return resolve()
        }
      })
    })
  }

  async unfollow (oauthAccessToken, oauthAccessTokenSecret) {
    try {
      cursor = -1  // Reset cursor for the unfollow actions
      await this.getFollowersIds(this.realUserName)
      let followedList = JSON.parse(fs.readFileSync(`./data/${this.userName}_followList`, 'utf8')).followedUsers
      const noMatchedFollowingIds = matchIds(followedList, user.followersIds)
      console.log('Unfollowing', noMatchedFollowingIds.length)
      noMatchedFollowingIds.map(async (user, index) => { // Don't need that await
        await Promise.delay(36000 * (index))
        await this.unfollowOneUser(user, oauthAccessToken, oauthAccessTokenSecret)
      })
    } catch (error) {
      throw error
    }
  }

  unfollowOneUser (userId, oauthAccessToken, oauthAccessTokenSecret) {
    console.log('Unfollowing one User')
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

  // function that will get the information about the API request limits status
  checkApiStatus () {
    return new Promise ((resolve, reject) => {
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
}

module.exports = { User }
