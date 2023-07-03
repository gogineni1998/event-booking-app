const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Event = require('../../models/events')
const User = require('../../models/users')
const Booking = require('../../models/booking')

require('dotenv').config()

const user = async (userId) => {
    const userDetails = await User.findOne({ _id: userId })
    const result = { ...userDetails}
    return result._doc
}

const event = async (eventId) => {
    const eventDetails = await Event.findOne({
        _id: eventId
    })
    return { ...eventDetails._doc, creator: await user.bind(this, eventDetails._doc.creator._id) }
}

module.exports = {
    login: async ({ userInput }) => {
        try {
            const findUser = await User.findOne({ email: userInput.email })
            if (findUser == null) {
                throw new Error('Email not Found')
            }
            const checkUser = bcrypt.compare(findUser.password, userInput.password)
            if (checkUser == false) {
                throw new Error('Password is incorrect')
            }
            const token = jwt.sign({ _id: findUser._id, email: findUser.email }, process.env.SECURE_KEY)
            return { _id: findUser._id, email: findUser.email, token: token }
        } catch (error) {
            throw error
        }
    },
    events: async () => {
        try {
            const events = await Event.find()
            const promises = Promise.all(events.map(async (event) => ({
                ...event._doc,
                creator: await user.bind(this, event._doc.creator._id)
            })))
            return promises
        } catch (error) {
            console.log(error);
            return error
        }
    },
    bookings: async () => {
        try {
            const fetchedBookings = await Booking.find()
            const result = await Promise.all(fetchedBookings.map(fetchedBooking => {
                return ({
                    ...fetchedBooking._doc,
                    event: event(fetchedBooking.event),
                    user: user(fetchedBooking.user)
                })
            }))
            return result
        } catch (error) {
            throw error
        }
    },
    createEvent: async ({ eventInput }, req) => {
        try {
            if (req.loggedIn == false) {
                throw new Error('User Not LoggedIn')
            }
            const event = new Event({
                title: eventInput.title,
                description: eventInput.description,
                price: +eventInput.price,
                date: new Date(eventInput.date),
                creator: req.user_data._id
            })
            const doc = await event.save()
            await User.updateOne(
                { _id: doc.creator },
                {
                    $push: { createdEvents: doc._id }
                }
            )
            const result = {...doc}
            return result._doc
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
    },
    bookEvent: async (args, req) => {
        try {
            if (req.loggedIn == false) {
                throw new Error('User Not LoggedIn')
            }
            const book = new Booking({
                event: args.eventId,
                user: req.user_data._id
            })
            const bookedEvent = await book.save()
            return { ...bookedEvent._doc, user: user(bookedEvent._doc.user), event: event(bookedEvent._doc.event) }
        } catch (error) {
            throw error
        }
    },
    cancelEvent: async (args, req) => {
        try {
            if (req.loggedIn == false) {
                throw new Error('User Not LoggedIn')
            }
            const booking = await Booking.findOne({ _id: args.bookingId })
            const eventDetails = await event(booking._doc.event)
            await Booking.findOneAndRemove({ _id: args.bookingId })
            return eventDetails
        } catch (error) {
            throw error
        }
    }
}