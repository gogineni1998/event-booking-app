const bodyParser = require('body-parser')
const express = require('express')
const mongoose = require('mongoose')
const resolvers = require('./graphql/resolvers/index')
const schema = require('./graphql/schemas/index')
const { graphqlHTTP } = require('express-graphql')

require('dotenv').config()
const app = express()
app.use(bodyParser.json())



app.use('/graphql',
    graphqlHTTP({
        schema: schema,
        rootValue: resolvers,
        graphiql: true
    }))

mongoose.connect(`mongodb+srv://gogineni1998:00LSOxwdKQ3ETVBu@eventscluster.edjssf1.mongodb.net/?retryWrites=true&w=majority`)
    .then(() => app.listen(3000))
    .catch((err) => console.log(err))  