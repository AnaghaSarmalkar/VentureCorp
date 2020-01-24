// Utility functions for interaction with Activities collection
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var activity_model= require('./../models/activity_detail.js');
var user_profile = require('./../models/user_profile.js');

// Get all activities from the Activities collection
function get_up_Activities(){
  var all_act = activity_model.activity_model.find({});
  return all_act;
};

// Get one activity depending upon activity_id
function get_one_Activity(id){
  var one_act = activity_model.activity_model.findOne({activity_id: id})
  return one_act;
};

// Get all activity ids
function get_all_act_id(){
  all_act = activity_model.activity_model.find({},{_id:0,activity_id:1});
  return all_act;
};

// Update activity created by user
function update_user_created_activity(user_id,activity_id, activity_details){
  return activity_model.activity_model.updateOne({activity_host_id: user_id,activity_id: activity_id},{$set:activity_details})
};

// Delete activity created by user
function delete_user_created_activity(user_id,activity_id){
  return activity_model.activity_model.deleteOne({activity_host_id: user_id,activity_id: activity_id});
  // return one_act;
};

// save activity created by user
function save_user_created_activity(userId,activity_id,addActivity){
  const newActivity = activity_model.activityCreator(
    addActivity,
    userId,
    activity_id,
  );
  return activity_model.activity_model.insertMany([newActivity]);
};

// Update User profile for activity updated by user
function update_only_one_user(user_id, activity) {
  const userReq = user_profile.user_model.findOne({ user_id })
  return userReq.then(user => {
    const userActivites = user.activity_rsvp;
    const listOfIds = userActivites.map(ua => ua.activity.activity_id);
    const activityId = activity.activity_id;

    if (listOfIds.includes(activityId)) {
      // console.log("Entered");
  // List of activities which are not changed
      const filteredList = userActivites.filter(ua => ua.activity.activity_id !== activityId);
      // List of changed activites
      const changeList = userActivites
                          .filter(ua => ua.activity.activity_id === activityId)
                          .map(ua => {
                              ua.activity = activity
                              return ua;
                          });

      const combinedList = [...filteredList, ...changeList];

      user.activity_rsvp = combinedList;
    }

    return user.save();
  })
}

// Update user profiles for all users for activity updated by user
function update_user_profile(activity) {
  const usersReq = user_profile.user_model.find()
  const userUpdatePromises = [];

  return usersReq.then(users => {
    users.forEach(user => {
      const userUpdate = update_only_one_user(user.user_id, activity);
      userUpdatePromises.push(userUpdate);
    })

    return Promise.all(userUpdatePromises);
  })
  // return user_profile.user_model.updateOne({user_id: user_id, "activity_rsvp.activity.activity_id.$":activity.activity_id},{$set: {"activity_rsvp.activity.$": activity}})
}

// delete User profile for activity updated by user
function delete_activity_for_one_user(user_id, activity){
  const userReq = user_profile.user_model.findOne({ user_id })
  return userReq.then(user => {
    const userActivites = user.activity_rsvp;
    const listOfIds = userActivites.map(ua => ua.activity.activity_id);
    const activityId = activity.activity_id;

    if (listOfIds.includes(activityId)) {
      // console.log("Entered, deletion");
  // List of activities which are not changed
      const filteredList = userActivites.filter(ua => ua.activity.activity_id !== activityId);

      user.activity_rsvp = filteredList;
    }

    return user.save();
  })

}

// delete user profiles for all users for activity updated by user
function deleteActivityEverywhere(activity) {
  const usersReq = user_profile.user_model.find()
  const userUpdatePromises = [];

  return usersReq.then(users => {
    users.forEach(user => {
      const userUpdate = delete_activity_for_one_user(user.user_id, activity);
      userUpdatePromises.push(userUpdate);
    })

    return Promise.all(userUpdatePromises);
  })
}

module.exports={
  get_up_Activities:get_up_Activities,
  get_one_Activity:get_one_Activity,
  get_all_act_id:get_all_act_id,
  update_user_created_activity:update_user_created_activity,
  delete_user_created_activity:delete_user_created_activity,
  save_user_created_activity:save_user_created_activity,
  update_user_profile:update_user_profile,
  deleteActivityEverywhere:deleteActivityEverywhere
};
