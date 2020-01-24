// Utility functioms for interaction with UserCreds collection
var mongoose = require('mongoose');
// mongoose.Promise = global.Promise;
var user_model= require('./../models/user_profile.js');
var usercreds_model= require('./../models/user_creds.js');


// function get_users(){
//   return all_users;
// };

// Get credentials for one user
function get_User(id){
  const user= usercreds_model.usercreation_model.findOne({user_id:id})
  return user;
};

// Get user profile
function get_User_Profile(id){
  var one_user = user_model.user_model.findOne({user_id:id});
  return one_user;
}

// Register a user
function add_user_Details(obj){
  const user = new usercreds_model.usercreation_model(obj);
  return user.save();
}

// Initialize user profile
function initialize_UserProfile(obj){
  const userprof = new user_model.user_model(obj);
  return userprof.save();
}


module.exports={
  // get_users:get_users,
  get_User:get_User,
  get_User_Profile:get_User_Profile,
  add_user_Details: add_user_Details,
  initialize_UserProfile:initialize_UserProfile
};
