const express = require('express')
const axios = require('axios')
const redis = require('redis')

const PORT = 9001
const app = express()
const REDIS_PORT = 6379

// redis
const client = redis.createClient({
	host: '127.0.0.1',
	legacyMode: true,
})

client.connect().catch(console.error);

const formatData = (name, no) => {
    return `${name} has ${no} repos`
}

// request data
const getData = async(req, res) => {
    try {
        const { username } = req.query;
        const response = await axios.get(`https://api.github.com/users/${username}`)
        client.setEx(username, 20, response.data.public_repos.toString())
        res.status(200).send(formatData(username, response.data.public_repos))
    }
    catch (err) {
        console.log(err, "err")
        res.status(500).send(err)
    }
}

// middleware
const cache = (req, res, next) => {
    const { username } = req.query;
    try {
        client.get(username, (err, data) => {
            if (err) throw err;

            if (data !== null) {
                console.log("This from redis")
                res.send(formatData(username, data))
            } else {
                console.log("This is not cached")
                next()
            }
        })
    }
    catch (err) {
        console.log(err)
    }
}

// connect to redis
client.on('connect', () => {
    console.log('Connected to Redis');
});

client.on('error', (err) => {
    console.log('Redis Client Error', err);
});

app.get('/get', cache, getData)

app.listen(PORT, () => {
    console.log(`App listening on ${PORT}`)
})
