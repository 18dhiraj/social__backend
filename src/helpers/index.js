var jwt = require('jsonwebtoken');

const getUserByToken = (token) => {
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
function extractFilePath(storageUrl) {
    // Match the path portion of the URL using a regular expression
    const match = storageUrl.match(/\/o\/([^?]+)/);
    if (match && match[1]) {
        // Decode URI component and replace %2F with /
        const path = decodeURIComponent(match[1]).replace(/%2F/g, '/');
        return path;
    } else {
        return null; // URL format doesn't match expected pattern
    }
}

module.exports = { sendError, getUserByToken, extractFilePath }