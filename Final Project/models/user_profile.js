// Create schemas for User profile
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var activity_schema = require('./../models/activity_detail.js');

var userActSchema = new Schema({
  activity: {type: activity_schema, default:{}},
  rsvp: {type:String, default:''}
});

var userSchema = new Schema({
  user_id: String,
  first_name: String,
  last_name: String,
  activity_rsvp:[userActSchema]
}, {collection: 'UserProfile'});

var user_model = mongoose.model('UserProfile', userSchema);


module.exports={
  user_model:user_model,
};
