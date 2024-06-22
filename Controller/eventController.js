const User = require('../Model/user');
const Event = require('../Model/events');
const jwt = require('jsonwebtoken');
const HelperFunc = require('../Utils/common');
const AutoComplete = require('../Model/autoComplete');

const postEvent = async (req, res, next) => {
  try {
    const userId = req.body.userId;
    const eventForm = req.body.eventForm;
    const eventId = req.body.eventForm._id;

    console.log(userId, eventId, eventForm);

    const newEvent = new Event({
      ...eventForm,
      createdBy: userId,
      attendees: [],
    });

    // Update Event
    if (eventId) {
      const event = await Event.findById(eventId);
      if (
        event._id.toString() === eventId.toString() &&
        event.createdBy.toString() === userId.toString()
      ) {
        event.basicInfo = eventForm.basicInfo;
        event.details = eventForm.details;
        event.schedule = eventForm.schedule;
        event.tickets = eventForm.tickets;
      }
      const updatedEvent = await event.save();
      console.log('Updated');
      res.status(200).json({ event: updatedEvent });
    }

    //Create NewEvent
    if (!eventId) {
      let savedEvent = await newEvent.save();
      const eventId = savedEvent._id;
      const foundUser = await User.findById(userId);
      foundUser.events.myEvents.push(eventId);
      await foundUser.save();
      const newData = new AutoComplete({
        title: savedEvent.basicInfo.eventTitle,
        section: 'event'
      })
      await newData.save()

      const user = await User.findById(userId)
        .populate({
          path: 'events.myEvents',
        })
        .exec();
      const token = jwt.sign({ user }, process.env.SECRET, {
        expiresIn: '24h',
      });
      res.status(200).json(token);
    }
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
};

//GET ALL EVENTS BY PAGINATION AND FILTERS
const getAllEvents = async (req, res, next) => {
  try {
    const filter = req.body;
    const type = filter?.activeComp;
    const page = filter.page;
    const keyword = filter.keywordSearch;
    const timeFrameStarts = filter?.timeFrame?.starts;
    const timeFrameEnds = filter?.timeFrame?.ends;
    const limit = filter.limit || 12;
    let query = {};

    if (keyword) {
      query['eventDetails.eventTitle'] = new RegExp(keyword, 'i');
    }
    // if(type === 'online'){
    //     query["eventDetails.isOnline"] = true
    // }
    // if(type === 'free'){
    //     query["eventDetails.isFree"]= true
    // }

    //get date range
    // if (timeFrameStarts ) {
    //     query["eventDetails.starts"] = {"$gte": new Date(timeFrameStarts)}
    // }
    // if (timeFrameEnds) {
    //     query["eventDetails.ends"] = {"$lte": new Date(timeFrameEnds)}
    // }

    console.log('EventQuery::', query);
    
    const count = await Event.find(query).countDocuments();

    const events = await Event.find(query)
      .skip(limit * page - limit)
      .limit(limit)
      .populate({
        path: 'createdBy',
        select: '_id avatar lastName firstName followers',
      })
    .exec();

    const sortedEvent = [];
    // get all the dates in the event schedule
    events.forEach((el) => {
      const { schedule } = el;
      const filteredSchedule = HelperFunc.filterSchedule(schedule);
      
      if(filteredSchedule.length > 0){
        sortedEvent.push(el)
      }
    });

    console.log('sortedEvent:::', sortedEvent)

    const data = {
      events: sortedEvent,
      count: Math.ceil(count / limit),
    };
    console.log(events.length);
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
};

// GET USER EVENTS
const getUserEvents = async (req, res, next) => {
  try {
    console.log(req.body);
    const userId = req.params.id;
    const count = await Event.find({ createdBy: userId }).countDocuments();
    // console.log(count);
    const perPage = 12;
    const page = req.body.currentPage;

    const events = await Event.find({ createdBy: userId })
      .skip(perPage * page - perPage)
      .limit(perPage)
      .select('basicInfo.eventTitle basicInfo.organizer details.summary tickets.sections schedule createdAt createdBy')
      .populate({
        path: 'createdBy',
        select: '_id avatar lastName firstName followers',
      })
      .exec();
    const data = {
      events,
      count: Math.ceil(count / perPage),
    };
    console.log(events.length);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json(err);
  }
};

//RETRIVE A Recipe BY ID
const getSingleEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId)
      .populate({
        path: 'createdBy',
        select: '_id avatar lastName firstName followers',
      })
      .exec();
    res.status(200).json(event);
  } catch (err) {
    res.status(400).json(err);
  }
};

//DELETING AN EVENT
const postDeleteEvent = async (req, res, next) => {
  try {
    // console.log(req.params.id)
    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    const organizerId = event.createdBy;
    //  delete recipe from author account
    const foundUser = await User.findById(organizerId)
      .populate({
        path: 'events.myEvents',
      })
      .exec();
    const userEvent = foundUser.events.myEvents;
    const delEvent = userEvent.findIndex(
      (el) => el._id.toString() === eventId.toString()
    );

    // // delete relations
    userEvent.splice(delEvent, 1);
    await Event.deleteMany({ _id: eventId });
    userEvent.remove();
    const user = await foundUser.save();

    const token = jwt.sign({ user }, process.env.SECRET, { expiresIn: '24h' });
    res.status(200).json({ token, deleted: true });
  } catch (err) {
    res.status(400).json({ err, deleted: false });
  }
};

module.exports = {
  postEvent,
  getAllEvents,
  getUserEvents,
  getSingleEvent,
  postDeleteEvent,
};
