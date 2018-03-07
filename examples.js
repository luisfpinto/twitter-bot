/* Delay Promises */
const Promise = require('bluebird')
const getUserInfo = (data) => {
    console.log('Getting user info')
    return new Promise((resolve, reject) => {
        if (data === 1) {
          return resolve('Hello World')
        }
        return Promise.delay(500).then(() => resolve(getUserInfo(1)))
    })
}

// getUserInfo().then(data => console.log(data))

/* Write Data and check if file exits */
var fs = require('fs');
const arr = ['Hello', 'world']
fs.writeFile('myjsonfile.json', json, 'utf8', callback);
fs.exists('myfile', (exists) => {
    if (exists) {
      console.error('myfile already exists');
    } else {
      fs.open('myfile', 'wx', (err, fd) => {
        if (err) throw err;
        writeMyData(fd);
      });
    }
  });