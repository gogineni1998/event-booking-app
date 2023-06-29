const bodyParser = require('body-parser')
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const Event = require('./models/events')
const User = require('./models/users')
const { graphqlHTTP } = require('express-graphql')
const { buildSchema } = require('graphql')
require('dotenv').config()
const app = express()
app.use(bodyParser.json())

const eventList = async (events) => {
    const eventDetails = await Event.find({
        _id : {$in : events}
    })
    return eventDetails
}

const user = async (userId) => {
    const userDetails = await User.findOne({_id : userId})
    return {...userDetails._doc, createdEvents : await eventList(userDetails._doc.createdEvents)}
}

app.use('/graphql',
    graphqlHTTP({
        schema: buildSchema(`
        type Event {
            _id : String!
            title : String!
            description : String!
            price : Float!
            date : String!
            creator : User!
        }
        type User {
            _id : String!
            email : String!
            password : String
            createdEvents : [Event!]
        }
        input EventInput {
            title : String!
            description : String!
            price : Float!
            date : String!
        }
        input UserInput {
            email : String!
            password : String!
        }
        type RootQuery {
            events : [Event!]!
        }
        type RootMutation {
            createEvent(eventInput : EventInput) : Event
            createUser(userInput : UserInput) : User
        }
        schema {
            query: RootQuery
            mutation: RootMutation
        }
        `),
        rootValue: {
            events: async () => {
                try {
                    const events = await Event.find()
                    const result = await Promise.all(events.map( async event => ({
                        ...event._doc,
                    creator : await user.bind(this,event._doc.creator._id)
                    })))
                    return result
                } catch (error) {
                    console.log(error);
                    return error
                }
            },
            createEvent: async ({ eventInput }) => {
                try {
                    const event = new Event({
                        title: eventInput.title,
                        description: eventInput.description,
                        price: +eventInput.price,
                        date: new Date(eventInput.date),
                        creator: '649d4619bb0a7f9ae6a508d7'
                    })
                    const doc = await event.save()
                    await User.updateOne(
                        {_id : doc._doc.creator},
                        {
                            $push : {createdEvents : doc._doc._id}
                        }
                    )
                    return doc._doc
                } catch (error) {
                    console.log(error);
                    return error
                }
            },
            createUser: async ({ userInput }) => {
                try {
                    const findUser = await User.findOne({ email: userInput.email })
                    if (findUser == null) {
                        const hash = await bcrypt.hashSync(userInput.password, 12);
                        const user = new User({
                            email: userInput.email,
                            password: hash
                        })
                        const createdUser = await user.save()
                        return { ...createdUser._doc, password: null }
                    }
                    else {
                        throw new Error("User Already Exists")
                    }
                } catch (error) {
                    throw error
                }
            }
        },
        graphiql: true
    }))

mongoose.connect(`mongodb+srv://gogineni1998:00LSOxwdKQ3ETVBu@eventscluster.edjssf1.mongodb.net/?retryWrites=true&w=majority`)
    .then(() => app.listen(3000))
    .catch((err) => console.log(err))  