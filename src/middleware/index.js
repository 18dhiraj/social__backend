const { sendError } = require("../helpers");
var jwt = require('jsonwebtoken');
let secret = process.env.JWT

const verifyToken = (req, res, next) => {
    let token = req.headers?.authorization || null
    try {
        if (token) {
            // token = token.replace(/^Bearer\s+/, "");
            let validate = jwt.verify(token, secret)
            if (validate) {
                next()
            } else {
                sendError("unauthorizedd!", res)
            }
        } else {
            sendError("unauthorized!", res)
        }


    } catch {
        sendError("some error occured!", res)
    }

}


module.exports = { verifyToken }