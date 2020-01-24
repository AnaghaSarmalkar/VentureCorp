// Create schemas for user credentials
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userCreatorSchema = new Schema({
  user_id:{type: String}, //this is email.
  first_name:{type: String},
  last_name:{type: String},
  address_1:{type: String},
  address_2:{type: String},
  city:{type: String},
  state:{type: String},
  zipcode:{type: String}, //could be problematic other places it is zip
  country:{type: String},
  password:{salt: {type: String}, passwordHash:{type: String}},
},{collection: 'UserCreds'})

// var usercreds_model = mongoose.model('UserCredentials', userCredsSchema);
var usercreation_model = mongoose.model('UserCreds', userCreatorSchema);


module.exports={
  usercreation_model:usercreation_model
};
