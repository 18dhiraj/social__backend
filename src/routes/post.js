const express = require('express');
const { sendError, getUserByToken, extractFilePath } = require('../helpers/index')
const { verifyToken } = require('../middleware')
const { client } = require('../connection')
const router = express.Router();
const multer = require('multer')
const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const { admin } = require('../initializeGoogleBucked')

var storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/create', verifyToken, upload.single('post'), async (req, res) => {

    try {
        let user = getUserByToken(req.headers.authorization)
        let database = client.db('Social');
        const posts = database.collection('posts');
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
                await file.save(imageBuffer, { gzip: true, metadata: metadata });
                postdata = {
                    user: new ObjectId(user._id),
                    title,
                    description,
                    image: 'https://firebasestorage.googleapis.com/v0/b/' + bucket.name + '/o/' + imageName + '?alt=media&token=' + id,
                    timestamp: new Date().toLocaleDateString()
                };
            } else {
                postdata = {
                    user: new ObjectId(user._id),
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
        // const allposts = await posts.find({}).toArray()
        const allposts = await posts.aggregate([
            { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "userDetails" } },
            { $unwind: '$userDetails' },
            {
                $project: {
                    title: 1,
                    description: 1,
                    image: 1,
                    timestamp: 1,
                    userDetails: "$userDetails"
                }
            }
        ]).toArray()
        // { from: "users", localField: "user_id", foreignField: "_id", as: "user" } 
        // const allpostss = await posts.aggregate()

        // console.log(allpostss)

        let resData = {
            "success": true,
            "data": allposts,
        }
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(resData)

    } catch {
        sendError("Some error occured!", res)
    }

})
router.post('/delete', verifyToken, async (req, res) => {

    try {
        let database = await client.db('Social');
        const posts = database.collection('posts');
        let id = req.body.id
        const query = { _id: new ObjectId(id) };
        let post = await posts.findOne(query);
        if (post.image) {
            let path = extractFilePath(post.image)
            const bucket = admin.storage().bucket();
            bucket.file(path).delete()
                .then(() => {
                    console.log('File deleted successfully');
                })
                .catch((error) => {
                    console.error('Error deleting file:', error);
                });
        }

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