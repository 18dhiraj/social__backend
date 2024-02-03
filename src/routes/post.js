const express = require('express');
const router = express.Router();
const { sendError, getUserByToken } = require('../helpers/index')
const { verifyToken } = require('../middleware')
const { client } = require('../connection')
const multer = require('multer')

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname + Date.now() + ".jpeg");
    },
});

const upload = multer({ storage: storage });

router.post('/create', verifyToken, upload.single('post'), async (req, res) => {

    let user = getUserByToken(req.headers.authorization)
    let database = await client.db('Social');
    const posts = database.collection('posts');

    let { title = '', description = '' } = req.body;

    if (title.trim() != '' && description.trim() != '') {

        const postdata = {
            user,
            title,
            description,
            image: req?.file?.fieldname ? "https://social-18.onrender.com/" + req.file.filename : null,
            timestamp: new Date().toLocaleDateString()
        };
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

    // } catch {
    //     sendError("Some error occured", res)
    // }

})


router.get('/', verifyToken, async (req, res) => {

    try {
        let database = await client.db('Social');
        const posts = database.collection('posts');

        const allposts = await posts.find({}).toArray()
        // console.log(allposts)
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

module.exports = router;