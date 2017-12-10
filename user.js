const { request, split, filterUser } = require('./helper')

let user = {}

class User {
  constructor (userName, filter) {
    this.userName = userName
    this.filter = filter
  }
  async getUser () {
    try {
      user.info = await this.getUserInfo(this.username)
      user.followers = await this.checkFollowers()
      if (this.filter !== undefined) user.filteredFollowers = await this.filterFollowers(this.filter, user.followers)
      return user
    } catch (error) {
      throw error
    }
  }
  getUserInfo () {
    console.log('Getting user info')
    return new Promise((resolve, reject) => {
      request('GET', `https://api.twitter.com/1.1/users/lookup.json?screen_name=${this.userName}`)
      .then(response => {
        user.userId = response.data[0].id_str
        user.numFollowers = response.data[0].followers_count
        return resolve({
          userName: this.userName,
          userId: response.data[0].id_str,
          numFollowers: response.data[0].followers_count
        })
      })
      .catch(err => reject(err))
    })
  }

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

  filterFollowers (filter, followers) {
    console.log('Filtering Followers')
    let responseIndex = 0
    return new Promise((resolve, reject) => {
      let filteredUsers = []
      console.log('Followers length', followers.length)
      followers.map((oneHundredFollowers, index) => {
        console.log('Filtering Followers for index', index)
        request('GET', `https://api.twitter.com/1.1/users/lookup.json?user_id=${oneHundredFollowers}`)
        .then(response => {
          responseIndex = responseIndex + 1
          console.log(responseIndex)
          response.data.map(user => {
            if (filterUser(user, this.filter)) {
              // console.log('User accepted')
              filteredUsers.push(user.id_str)
            } // else console.log('User did not pass the filter')
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
}

module.exports = { User }
