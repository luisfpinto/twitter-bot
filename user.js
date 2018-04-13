const { request, filterUsers, matchIds, saveFollowedUser, updateListToFollow } = require('./helper')
const { oAuth } = require('./routes/authentication')
const Promise = require('bluebird')
var fs = require('fs')

let user // User info
let cursor = -1 // we use this variable for the checkFollowers function to go through all our users see more https://developer.twitter.com/en/docs/basics/cursoring checkFollowers()
let rateLimitStatus

class User {
  constructor (realUserName, realUserId, userName) {
    this.realUserName = realUserName // Name of the original account (My account)
    this.realUserId = realUserId
    this.userName = userName // Name of the friend we want to get the followers
  }

  // This function will manage all the process to get the followers of an account
  async getUserInfo () {
    try {
      rateLimitStatus = await this.checkApiStatus()
      user = await this.userInfo(this.userName)
      return {user}
    } catch (err) {
      throw err
    }
  }

  // This function provides the whole information we want to get the followers from
  userInfo (user) {
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
      fs.stat(`./data/${this.userName}`, async (stat, error) => {
        try {
          // Don't check fs error. When there is no file error is not empty
          if (stat !== null) { // There aren't any filet yet
            user.followingListRaw = await this.getFollowersList()
            fs.writeFile(`./data/${user.userName}`, JSON.stringify(user), 'utf8')
            return resolve(user.followingListRaw)
          } else {
            console.log('Retrievieng List')
            user = JSON.parse(fs.readFileSync(`./data/${this.userName}`, 'utf8'))
            return resolve(user.followingListRaw)
          }
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  // This function will get all the followers information
  getFollowersList () {
    console.log('Checking followers')
    return new Promise((resolve, reject) => {
      request('GET', `https://api.twitter.com/1.1/followers/list.json?cursor=${cursor}&screen_name=${this.userName}`)
      .then(response => {
        rateLimitStatus.remaining--
        if (response.data['next_cursor'] === 0) {
          if (!user.followingListRaw) user.followingListRaw = response.data.users
          else user.followingListRaw.push.apply(user.followingListRaw, response.data.users)
          cursor = -1 // reset cursor
          return resolve(user.followingListRaw)
        } else {
          console.log(rateLimitStatus.remaining)
          cursor === -1 ? user.followingListRaw = response.data.users : user.followingListRaw.push.apply(user.followingListRaw, response.data.users)
          cursor = response.data['next_cursor']
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

  // Apply filters to the RAW LIST {filter: 'soft', 'medium' or 'hard', keyword: 'keyword'}
  filterList (filters) {
    console.log('Filtering List')
    user.followingListFiltered = filterUsers(user.followingListRaw, filters)
    return user.followingListFiltered
  }

  /*
  Update list to follow and popup:
  - Users that I've already followed from the List
  - Users who follow me
  - Users that I currently follow in my profile
  */
  async updateList () {
    try {
      console.log('Updating List')
      const usersToFollow = user.followingListFiltered ? user.followingListFiltered : user.followingListRaw
      const usersAlreadyFollowed = JSON.parse(fs.readFileSync(`./data/${this.userName}_followList`, 'utf8')).followedUsers
      const followersIds = await this.getFollowersIds()
      const friendsIds = await this.getFriendsIds()
      const usersToPopUp = usersAlreadyFollowed.concat(followersIds, friendsIds)
      return updateListToFollow(this.userName, usersToFollow, usersToPopUp)
    } catch (error) {
      return error
    }
  }

  async follow (oauthAccessToken, oauthAccessTokenSecret, users, range) {
    console.log('Following List')
    let rangeAux = range
    const pArray = users.map(async (user, index) => {
      try {
        if ((rangeAux > 0 || !range) && user.id_str !== this.realUserId) {
          rangeAux--
          await Promise.delay(36000 * (index))
          await this.followOneUser(user.id_str, oauthAccessToken, oauthAccessTokenSecret)
          return user.id_str
        }
      } catch (error) {
        return (error)
      }
    })
    await Promise.all(pArray)
    return pArray
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
    let pArray
    try {
      await this.getFollowersIds()
      let followedList = JSON.parse(fs.readFileSync(`./data/${this.userName}_followList`, 'utf8')).followedUsers
      const noMatchedFollowingIds = matchIds(followedList, user.followersIds)
      console.log('Unfollowing', noMatchedFollowingIds.length)
      pArray = noMatchedFollowingIds.map(async (user, index) => { // Don't need that await
        await Promise.delay(36000 * (index))
        await this.unfollowOneUser(user, oauthAccessToken, oauthAccessTokenSecret)
        return user
      })
    } catch (error) {
      throw error
    }
    await Promise.all(pArray)
    return pArray
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

  // Get users who follow me
  getFollowersIds () {
    return new Promise((resolve, reject) => {
      console.log('Checking follower Ids')
      request('GET', `https://api.twitter.com/1.1/followers/ids.json?cursor=${cursor}&screen_name=${this.realUserName}`)
      .then(response => {
        rateLimitStatus.remaining--
        if (response.data['next_cursor'] === 0) {
          if (!user.followersIds) user.followersIds = response.data.ids
          else user.followersIds.push.apply(user.followersIds, response.data.ids)
          cursor = -1 // reset cursor
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

  // Get users I follow
  getFriendsIds () {
    return new Promise((resolve, reject) => {
      console.log('Checking follower Ids')
      request('GET', `https://api.twitter.com/1.1/friends/ids.json?cursor=${cursor}&screen_name=${this.realUserName}`)
      .then(response => {
        rateLimitStatus.remaining--
        if (response.data['next_cursor'] === 0) {
          if (!user.friendsIds) user.friendsIds = response.data.ids
          else user.friendsIds.push.apply(user.friendsIds, response.data.ids)
          cursor = -1 // reset cursor
          return resolve()
        } else {
          console.log(rateLimitStatus.remaining)
          console.log(user.friendsIds)
          cursor === -1 ? user.friendsIds = response.data.ids : user.friendsIds.push.apply(user.friendsIds, response.data.users)
          cursor = response.data['next_cursor']
          console.log(user.friendsIds.length)
          let delay = 0
          if (rateLimitStatus.remaining === 0) {
            delay = 900000
            rateLimitStatus.remaining = 30
          }
          return Promise.delay(delay).then(() => resolve(this.getFriendsIds(cursor)))
        }
      })
      .catch(err => {
        console.log('ERRRRR on getting friends Ids', err)
        reject(err)
      })
    })
  }

  // function that will get the information about the API request limits status
  checkApiStatus () {
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
}

module.exports = { User }
