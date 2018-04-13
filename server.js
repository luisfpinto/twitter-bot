const express = require('express')
var session = require('express-session')
const app = express()
var bodyParser = require('body-parser')

const { auth } = require('./routes/authentication')
const { user } = require('./routes/user')
const { PORT, secret } = require('./config')
app.use(session({
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set this to false to allow using non https hosts
}))

app.use('/auth', auth)
app.use('/user', user)
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})

app.use('*', (req, res) => {
  res.send('Forbidden!')
})