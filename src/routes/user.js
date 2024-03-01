
const express = require('express');
const router = express.Router();
const { sendError, getUserByToken } = require('../helpers')
const { client } = require('../connection')
let secret = process.env.JWT
const { verifyToken } = require('../middleware')
const { admin } = require('../initializeGoogleBucked')
const { ObjectId } = require('mongodb');
const multer = require('multer')
const { v4: uuidv4 } = require('uuid');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

var storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/login', async (req, res) => {
    const { email = '', password = '' } = req.body
    if (email?.trim() != '' && password?.trim() != '') {

        let database = client.db('Social');
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

        let database = client.db('Social');
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
    // console.log(token)
    if (token) {
        let response = jwt.decode(token)
        if (response?.user) {
            let database = client.db('Social');
            const users = database.collection('users');
            const query = { email: res.user.email };
            let user = await users.findOne(query);

            let resData = {
                "data": user,
                "success": true,
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
router.post('/profileimage', verifyToken, upload.single('profileImage'), async (req, res) => {

    if (req.file) {
        let id = uuidv4();
        let database = client.db('Social');
        const users = database.collection('users');
        let user = getUserByToken(req.headers.authorization);
        const bucket = admin.storage().bucket();
        const imageBuffer = req.file.buffer;
        const imageName = req.file.originalname;
        const file = bucket.file(imageName);
        const metadata = {
            metadata: {
                firebaseStorageDownloadTokens: id
            },
            contentType: 'image/png',
            cacheControl: 'public, max-age=31536000',
        };
        await file.save(imageBuffer, { gzip: true, metadata: metadata });

        let image = 'https://firebasestorage.googleapis.com/v0/b/' + bucket.name + '/o/' + imageName + '?alt=media&token=' + id
        await users.findOneAndUpdate(
            { "_id": new ObjectId(user._id) },
            { $set: { image: image } },
            { upsert: true }
        )

        let profileData = {
            name: user.name,
            email: user.email,
            image: image
        }
        let resData = {
            "success": true,
            "message": profileData,
        }
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(resData)
    }
    else {
        sendError("Invalid credentials", res)
    }

})

module.exports = router;