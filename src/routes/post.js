const express = require('express');
const { sendError, getUserByToken } = require('../helpers/index')
const { verifyToken } = require('../middleware')
const { client } = require('../connection')
const router = express.Router();
const multer = require('multer')
const { ObjectId } = require('mongodb');
var admin = require("firebase-admin");
const { v4: uuidv4 } = require('uuid');


let initializeFirebasestorage = {
    type: process.env.TYPE,
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLINET_ID,
    auth_uri: process.env.AUTH_ID,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTHPROVIDER_ID,
    client_x509_cert_url: process.env.CLIENTCERT_URL,
    universe_domain: process.env.UNIVERSAL_DOMAIN
}

admin.initializeApp({
    credential: admin.credential.cert(initializeFirebasestorage),
    storageBucket: process.env.STORAGE_BUCKET
});

var storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/create', verifyToken, upload.single('post'), async (req, res) => {

    try {
        console.log(1)
        let user = getUserByToken(req.headers.authorization)
        let database = client.db('Social');
        const posts = database.collection('posts');
        // console.log(req.body)
        let { title, description } = req.body;

        if (title != undefined && title.trim() != "" && description != undefined && description.trim() != '') {
            let id = uuidv4();
            let postdata
            if (req.file) {
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
                const result = await file.save(imageBuffer, { gzip: true, metadata: metadata });
                console.log('Image uploaded successfully:', result);
                postdata = {
                    user,
                    title,
                    description,
                    image: 'https://firebasestorage.googleapis.com/v0/b/' + bucket.name + '/o/' + imageName + '?alt=media&token=' + id,
                    timestamp: new Date().toLocaleDateString()
                };
            } else {
                postdata = {
                    user,
                    title,
                    description,
                    image: null,
                    timestamp: new Date().toLocaleDateString()
                };
            }

            await posts.insertOne(postdata);
            let resData = {
                "success": true,
                "data": postdata,
            }
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.send(resData)
        } else {
            sendError("Please fill all the fields!", res)
        }
    } catch {
        sendError("Some error occured", res)
    }

})


router.get('/', verifyToken, async (req, res) => {

    try {
        let database = client.db('Social');
        const posts = database.collection('posts');
        const allposts = await posts.find({}).toArray()
        let resData = {
            "success": true,
            "data": allposts,
        }
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(resData)

    } catch {
        sendError("Some error occured", res)
    }

})
router.post('/delete', verifyToken, async (req, res) => {

    try {
        let database = await client.db('Social');
        const posts = database.collection('posts');
        let id = req.body.id
        const allposts = await posts.deleteOne({ _id: new ObjectId(id) })
        if (allposts.deletedCount) {
            let resData = {
                "success": true,
                "data": allposts,
            }
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.send(resData)
        } else {
            sendError("Not forund! please try again!", res)
        }

    } catch {
        sendError("Some error occured", res)
    }

})

module.exports = router;