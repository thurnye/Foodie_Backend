const mongoose = require('mongoose');
const {Schema} = mongoose;


const eventsSchema = new Schema({
    // eventDetails : {
        // eventTitle: {
        //     type: String,
        //     required: true
        // },
    //     location: {
    //             name: {
    //                 type: String
    //             },
    //             url: {
    //                 type: String
    //             },
    //             coordinates: {
    //                 lat: {
    //                     type: Number
    //                 },
    //                 lng: {
    //                     type: Number
    //                 }
    //             },
    //             formattedAddress: {
    //                 type: String
    //             }
    //     },
    //     isOnline: Boolean,
    //     isFree: Boolean,
    //     repeat: Boolean,
    //     frequency: String,
    //     thumbnail: {
    //         type: String,
    //         required: true
    //     },
    //     eventDescription: {
    //         type: String,
    //         required: true
    //     },
    //     addFAQs: Boolean,
    //     starts:{
    //         type: Date,
    //         required: true
    //     },
    //     ends:{
    //         type: Date,
    //         required: true
    //       },
    //     fAQs:[{
    //       ques: {
    //         type: String,
    //         required: false
    //       },
    //       ans: {
    //         type: String,
    //         required: false
    //       },
    //     }],
    //     organiserName: {
    //         type: String,
    //         required: true
    //     },
    //     organiserDescription: {
    //         type: String,
    //         required: true
    //     },
    //     includeLinks: Boolean
    // },
    // tickets : [
    //     {
    //       ticketName : {
    //           type: String,
    //           required: true
    //       },
    //       quantity: {
    //           type: Number,
    //           required: true
    //       },
    //       price: {
    //           type: Number,
    //           required: true
    //       },
    //       ticketDescription: String,
    //       showDescriptionOnEventPage: Boolean, //default false
    //       onlineSales: Boolean,
    //       doorSales: Boolean,
    //       starts: {
    //           date: String,
    //       },
    //       ends: {
    //           date: String,
    //       },
    //       ticketVisibility: Boolean,  // false, hide ticket when max is reached,
    //       autoHideDate:{
    //           date: String,
    //       },
    //       ticketsPerOrder: {
    //         min: {
    //           type: Number,
    //           required: true
    //           },
    //         max: {
    //           type: Number,
    //           required: true
    //       }
    //       }
    //     }
    // ],
    // additionalSettings: { 
    //       currency: {
    //           label: {
    //               type: String,
    //               required: false
    //           },
    //           symbol: {
    //               type: String,
    //               required: false
    //           },
    //           currency: {
    //               type: String,
    //               required: false
    //           }
    //       }
    // },
    
    
    basicInfo: {
        eventTitle: {
        type: String,
        required: true
        },
        locationState: {
            type: String,
            required: true
        },
        dateOccurrence: {
            type: String,
            required: true
        },
        dateTime: {
            start: {
                type: String,
                required: false
            },
            end: {
                type: String,
                required: false
            }
        },
        location: {
            name: {
                type: String
            },
            url: {
                type: String
            },
            coordinates: {
                lat: {
                    type: Number
                },
                lng: {
                    type: Number
                }
            },
            formattedAddress: {
                type: String
            }
        },
        organizer: {
            type: String,
            required: true
        },
        tags: [{
            label: {type: String}, 
            value: {type: String} 
        }]
    },
    schedule: [],
    details: {
        images: [],
        summary: {
        type: String,
        required: true
    },
        about: [],
        faqs: [{
            ques: { type: String},
            ans: {type: String},
        }]
    },
    tickets: {
        capacity: {
            type:{
                type: String,
                required: true
            },
            value: {
                type: Number,
                required: true
            }
        },
        sections: []
    },
    attendees: [{
      type: Schema.Types.ObjectId,
      required: false,
      ref: 'User'
    }],
    createdBy: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }},
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Events', eventsSchema);