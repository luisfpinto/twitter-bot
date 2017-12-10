const { request, split, filterUser } = require('./helper')

let user = {}

class User {
  constructor (userName, filter) {
    this.userName = userName
    this.filter = filter
  }
  async getUser () {
    try {
     // user.info = await this.getUserInfo(this.username)
      user.followers = await this.checkFollowers()
      user.filteredFollowers = await this.filterFollowers(this.filter, user.followers[0])
      console.log('HOLA')
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
    return new Promise((resolve, reject) => {
      let follow = [followers[0], followers[1]]
      console.log(follow)
      request('GET', `https://api.twitter.com/1.1/users/lookup.json?screen_name=${follow}`)
      .then(response => {
        console.log(response)
        console.log('User filtered', filterUser(response.data[0], filter))
        return resolve(true)
      })
      .catch(err => reject(err))
    })
  }
}

module.exports = { User }
