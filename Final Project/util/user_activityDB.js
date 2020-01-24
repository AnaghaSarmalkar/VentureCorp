// Utility functions for interaction with UserProfile Schema
var mongoose = require('mongoose');
// mongoose.Promise = global.Promise;
var user_model = require('./../models/user_profile.js');

class userProfile {
  constructor(user) {
    // will always be there since random user is being selected.
    this.user_id = user.user_id;
    this.user_activities = user.activity_rsvp;
  }

// Add activity for user
  async addActivity(activity, rsvp, callback) {
    this.user_activities.push({activity: activity, rsvp: rsvp});
    //var a = user_model.user_model.update({user_id:this.user_id},{$push:{activity_rsvp:{activity: activity, rsvp:rsvp}}});
    var user = await user_model.user_model.findOne({user_id: this.user_id});

    const listOfIds = user.activity_rsvp.map(a => a.activity.activity_id);

    if (listOfIds.includes(activity.activity_id)) {
      const userActivity = user.activity_rsvp.filter(
        act => act.activity.activity_id !== activity.activity_id,
      );
      // // console.log(userActivity);
      userActivity.push({
        activity,
        rsvp,
      });
      user.activity_rsvp = userActivity;
    } else {
      user.activity_rsvp.push({
        activity,
        rsvp,
      });
    }
    await user.save();
    callback(user.activity_rsvp);

    // // console.log("Test", user)
  }

// Update user activity
  updateActivity(userActivity) {
    // // console.log("userActivity",userActivity);
    var match = 0;
    for (var i = 0; i < this.user_activities.length; i++) {
      var obj = this.user_activities[i];
      // // console.log("obj",obj);
      if (obj.activity.activity_id === userActivity.activity.activity_id) {
        // update the list
        obj.rsvp = userActivity.rsvp;
        match = match + 1;
        // break;
      }
    }
    return match;
    // this.user_activities.push(userActivity);
  }

// Remove/delete user activity from saved activities
  async removeActivity(activity_id, callback) {
    this.user_activities = this.user_activities.filter(
      act => act.activity.activity_id !== activity_id,
    );

    const user = await user_model.user_model.findOne({user_id: this.user_id});

    user.activity_rsvp = user.activity_rsvp.filter(
      act => act.activity.activity_id !== activity_id,
    );

    await user.save();
    callback(user.activity_rsvp);
  }

// get all user profile activities
  getActivities() {
    return user_model.user_model.find({});
  }

  async emptyProfile(callback) {
    this.user_activities = [];

    const user = await user_model.user_model.findOne({user_id: this.user_id});

    user.activity_rsvp = [];

    await user.save();
    callback(user.activity_rsvp);
  }
}

module.exports = {
  userProfile: userProfile,
};
