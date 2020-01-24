// Controller for user specific actions (user_profile)
var express = require('express');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended: false});

var router = express.Router();
var use_activity_model = require('./../util/user_activityDB.js');
var userDB = require('./../util/userDB.js');
var activityDB = require('./../util/activityDB.js');
var mongoose = require('mongoose');

// Route to get the user profile (saved_activities)
router.get('/', function(req, res) {
  if (!req.session.theUser) {
    // Get the user from the database, add to session as theUser
    if (req.session.user_id){
      userDB.get_User_Profile(req.session.user_id).then(function(one_user) {
        req.session.theUser = one_user;
        // // console.log(req.session);
        delete req.session.user_id;
        res.render('saved_activities', {
          user: req.session.theUser,
          activities: req.session.theUser.activity_rsvp,
        });
      });
    }
    else{
      res.redirect('/login')
    }
    // delete req.session.user_id;
  } else {
    // console.log(req.session.theUser.activity_rsvp);
    res.render('saved_activities', {
      user: req.session.theUser,
      activities: req.session.theUser.activity_rsvp,
    });
  }
});

// This handles both update(update rsvps) and add requests.
// routes for user rsvp action for every activity.
router.post('/', urlencodedParser, function(req, res) {
  if (req.session.theUser) {
    var userProfile_obj = new use_activity_model.userProfile(
      req.session.theUser,
    );
    activityDB.get_all_act_id().then(function(act_ids) {
      var all_act_ids = act_ids.map(act => act.activity_id);
      // Activity request is according to what is in the activity database. handles unknown activity id requests
      if (all_act_ids.includes(req.body.activity_id)) {
        activityDB
          .get_one_Activity(req.body.activity_id)
          .then(function(one_act) {
            userProfile_obj.addActivity(one_act, req.body.rsvp, function(
              activities,
            ) {
              // req.session.theUser.activity_rsvp=activities
              userDB.get_User_Profile(req.session.theUser.user_id).then(function(user) {
                req.session.theUser = user;
                res.redirect('/saved_activities');
              });
              // // console.log("Hi me three!")
              // res.render('saved_activities', {
              //   user: req.session.theUser,
              //   activities,
              // });
            });
          });
      } else {
        userDB.get_User_Profile(req.session.theUser.user_id).then(function(user) {
          req.session.theUser = user;
          res.redirect('/saved_activities');
        });
      }
    });
  } else {
    // // console.log("Hi me!")
    res.redirect('/saved_activities');
  }
});



// This handles delete requests
router.post('/activity_action', urlencodedParser, function(req, res) {
  if (req.session.theUser) {
    const activity_id = req.body.activity_id;
    if (req.body.activity_action === 'Update') {
      const red = `/activity_detail?activity_id=${activity_id}`;
      res.redirect(red);
    } else if (req.body.activity_action === 'Delete') {
      req.session.theUser.activity_rsvp = req.session.theUser.activity_rsvp.filter(
        act => act.activity.activity_id !== activity_id,
      );
      var userProfile_obj = new use_activity_model.userProfile(
        req.session.theUser,
      );

      userProfile_obj.removeActivity(activity_id, activities => {
        res.render('saved_activities', {
          user: req.session.theUser,
          activities,
        });
      });
    }

  } else {
    res.redirect('/saved_activities');
  }
});

// This clears the profile from session keeping the user details intact
router.post('/clear_profile', urlencodedParser, function(req, res) {
  if (req.session.theUser) {
    if (req.body.user_action === 'Clear Profile') {
      req.session.theUser.activity_rsvp = [];
      var userProfile_obj = new use_activity_model.userProfile(
        req.session.theUser,
      );

      userProfile_obj.emptyProfile(activities => {
        res.render('saved_activities', {
          user: req.session.theUser,
          activities,
        });
      });
    } else {
      res.redirect('/saved_activities');
    }
  } else {
    res.redirect('/saved_activities');
  }
});

module.exports = router;
