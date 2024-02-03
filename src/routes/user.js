
const express = require('express');
const router = express.Router();
const { sendError } = require('../helpers')
const { client } = require('../connection')
let secret = process.env.JWT
const { verifyToken } = require('../middleware')

var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

router.post('/login', async (req, res) => {
    // console.log(req.body)
    const { email = '', password = '' } = req.body

    if (email?.trim() != '' && password?.trim() != '') {

        let database = await client.db('Social');
        const users = database.collection('users');
        const query = { email };
        let user = await users.findOne(query);


        if (user) {
            let validate = await bcrypt.compare(password, user.password)
            if (validate) {
                delete user.password
                var token = jwt.sign({ user }, secret);
                let resData = {
                    "success": true,
                    "data": user,
                    "token": token
                }
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.send(resData)
            } else {
                sendError("Invalid credentials", res)
            }
        } else {
            sendError("User Not found", res)
        }
    }
    else {
        sendError("Please fill all the fields!", res)
    }

})



router.post('/signup', async (req, res) => {

    const { email = '', password = '', name = '' } = req.body
    if (email?.trim() != '' && password?.trim() != '' && name?.trim() != '') {

        await client.connect();
        let database = await client.db('Social');
        const users = database.collection('users');
        let ress = await users.findOne({ email })
        if (ress == null) {
            var salt = bcrypt.genSaltSync(10);
            var hash = bcrypt.hashSync(password, salt);
            const adduser = { name, email, password: hash };
            await users.insertOne(adduser);
            let user = await users.findOne({ email })
            delete user.password
            let token = jwt.sign({ user }, secret)

            let resData = {
                "success": true,
                "data": user,
                token: token
            }

            res.setHeader('Access-Control-Allow-Origin', '*');
            res.send(resData)
        } else {
            sendError("User already exists", res)
        }
    }
    else {
        sendError("Invalid credentials", res)
    }

})

router.get('/profile', verifyToken, async (req, res) => {

    let token = req.headers?.authorization || null

    if (token) {
        let response = await jwt.decode(token)
        if (response?.user) {
            let resData = {
                "success": true,
                "data": response.user,
            }
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.send(resData)
        } else {
            sendError("Invalid token", res)
        }
    }
    else {
        sendError("Invalid credentials", res)
    }

})

module.exports = router;