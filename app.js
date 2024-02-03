const express = require('express');
const cors = require("cors");
const { run } = require('./src/connection')
const userRouter = require('./src/routes/user')
const postRouter = require('./src/routes/post')

var bodyParser = require('body-parser')
require('dotenv').config()

const app = express();

const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOptions))

app.use(bodyParser.json());
app.use(express.static("uploads"));


run().then(() => {
    console.log("connected!")
}).catch((err) => console.log(err))


app.use('/', userRouter)
app.use('/post', postRouter)

let PORT = process.env.PORT

app.listen(PORT, () => {
    console.log("connedted to the server.......")
});



