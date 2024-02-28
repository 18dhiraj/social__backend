var admins = require("firebase-admin");

const key = Buffer.from(process.env.PRIVATE_KEY, 'base64').toString('ascii');

let initializeFirebasestorage = {
    type: process.env.TYPE,
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: key,
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLINET_ID,
    auth_uri: process.env.AUTH_ID,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTHPROVIDER_ID,
    client_x509_cert_url: process.env.CLIENTCERT_URL,
    universe_domain: process.env.UNIVERSAL_DOMAIN
}

let admin = admins.initializeApp({
    credential: admins.credential.cert(initializeFirebasestorage),
    storageBucket: process.env.STORAGE_BUCKET
});


module.exports = { admin }
