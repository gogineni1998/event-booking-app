const jwt = require('jsonwebtoken')
require('dotenv').config()
const User = require('../models/users')
module.exports = async (req, rsp, next) => {
    try {
        const headers = JSON.parse(JSON.stringify(req.headers))
    if('authorization' in headers) {
        const user_data =  jwt.verify(JSON.parse(headers.authorization), process.env.SECURE_KEY)
        const user = await User.findOne({_id : user_data._id})
        if(user != null) {
            req.loggedIn = true
            req.user_data = user_data
        }
        else {
            req.loggedIn = false
        }
    }
    else {
        req.loggedIn = false
    }
    next()
    } catch (error) {
        rsp.send(error)
    }
    
}