const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()


const uri = process.env.MONGO_URL 
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    return client.connect()
}

module.exports = { run, client }