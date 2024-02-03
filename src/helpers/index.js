

var jwt = require('jsonwebtoken');

const getUserByToken = (token) => {
    console.log(token)
    if (token) {
        token = token.replace(/^Bearer\s+/, "");
        let data = jwt.decode(token)
        return data.user
    } else {
        return false
    }
}
const sendError = (message, res) => {
    let resData = {
        "success": false,
        "data": null,
        "message": message
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(resData)
}

module.exports = { sendError, getUserByToken }