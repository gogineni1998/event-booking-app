const { buildSchema } = require('graphql')

module.exports = buildSchema(`
type Booking {
    _id : String!
    event : Event!
    user : User!
    createdAt : String!
    updatedAt : String!
}
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
    bookings : [Booking!]!
}
type RootMutation {
    createEvent(eventInput : EventInput) : Event
    createUser(userInput : UserInput) : User
    bookEvent(eventId : String) : Booking!
    cancelEvent(bookingId : String) : Event!
}
schema {
    query: RootQuery
    mutation: RootMutation
}
`)