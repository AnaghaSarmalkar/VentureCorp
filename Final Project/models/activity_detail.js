// Topic model for business data
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Create Schema and model
// Creating all field names as string type
var activitySchema = new Schema(
  {
    activity_id: String,
    activity_name: String,
    activity_topic: String,
    activity_date: String,
    activity_time: String,
    activity_details: String,
    activity_loc: String,
    activity_host: String,
    activity_host_id: String,
  },
  {collection: 'Activities'},
);

// colelction name(singular), base it on this schema
var activity_model = mongoose.model('Activities', activitySchema);

var activityCreator = function(obj, host_id, activity_id) {
  var activitymodel = {
    ...obj,
    activity_host_id: host_id,
    activity_id:activity_id,
  };
  return activitymodel;
};

// Export models
module.exports = {
  activity_model: activity_model,
  activity_schema: activitySchema,
  activityCreator: activityCreator,
};
