const bcrypt = require('bcrypt')
const Event = require('../../models/events')
const User = require('../../models/users')
const Booking = require('../../models/booking')

const eventList = async (events) => {
    const eventDetails = await Event.find({
        _id: { $in: events }
    })
    return eventDetails
}

const user = async (userId) => {
    const userDetails = await User.findOne({ _id: userId })
    return { ...userDetails._doc, createdEvents: await eventList(userDetails._doc.createdEvents) }
}

const event = async (eventId) => {
    const eventDetails = await Event.findOne({
        _id: eventId
    })
    return { ...eventDetails._doc, creator: await user.bind(this, eventDetails._doc.creator._id) }
}

module.exports = {
    events: async () => {
        try {
            const events = await Event.find()
            const promises = Promise.all(events.map(async (event) => ({
                ...event._doc,
                creator: await user.bind(this, event._doc.creator._id)
            })))
            console.log(promises);
            return promises
        } catch (error) {
            console.log(error);
            return error
        }
    },
    bookings : async () => {
        try {
            const fetchedBookings = await Booking.find()
            const result = await Promise.all(fetchedBookings.map( fetchedBooking => {
                return ({
                    ...fetchedBooking._doc,
                    event :  event(fetchedBooking.event),
                    user :  user(fetchedBooking.user)
                })
            }))
            return result
        } catch (error) {
            throw error
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
                { _id: doc._doc.creator },
                {
                    $push: { createdEvents: doc._doc._id }
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
    },
    bookEvent: async (args) => {
        try {
            const book = new Booking({
                event: args.eventId,
                user: '649d4619bb0a7f9ae6a508d7'
            })
            const bookedEvent = await book.save()
            return { ...bookedEvent._doc, user: user(bookedEvent._doc.user), event: event(bookedEvent._doc.event) }
        } catch (error) {
            throw error
        }
    },
    cancelEvent: async (args) => {
        try {
            const booking = await Booking.findOne({_id : args.bookingId})
            const eventDetails = await event(booking._doc.event)
            await Booking.findOneAndRemove({_id : args.bookingId})
            return eventDetails
        } catch (error) {
            throw error
        }
    }
}