var express = require('express');
var session = require('express-session');
var app = express();
var bodyParser = require('body-parser');
const expressSanitizer = require('express-sanitizer');

const {check, validationResult, body} = require('express-validator');
var urlencodedParser = bodyParser.urlencoded({extended: true});
// Import data model
var activity_model = require('./models/activity_detail.js');
var activityDB = require('./util/activityDB.js');
var userDB = require('./util/userDB.js');

//import profileController
var user = require('./routes/profileController.js');


const helmet = require('helmet');
var crypto = require('crypto');

// Generate random strings
var genRandomString = function(length) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex') /** convert to hexadecimal format */
    .slice(0, length); /** return required number of characters */
};
// take randstring and generate password hash
var sha512 = function(password, salt) {
  var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
  hash.update(password);
  var value = hash.digest('hex');
  return {
    salt: salt,
    passwordHash: value,
  };
};
// Set up database connection through mongoose
var mongoose = require('mongoose');
var mongoDB = 'mongodb://127.0.0.1:27017/VentureCorpDB';
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function() {
  // // // console.log('VentureCorpDB connected!');
});
mongoose.Promise = global.Promise;


app.use(helmet.xssFilter());
app.use(expressSanitizer());

// Start user session
app.use(
  session({secret: 'userSession', resave: false, saveUninitialized: true}),
);

app.set('view engine', 'ejs');
app.use('/assets', express.static('assets'));
app.use('/saved_activities', user);

// Route to the index page
app.get('/', function(req, res) {
  res.render('index', {user: req.session.theUser});
});


// Route to upcoming activities
app.get('/up_activities', function(req, res) {
  if (Object.keys(req.query).length === 0) {
    // // // // console.log(typeof activityDB.get_up_Activities());
    activityDB.get_up_Activities().then(function(activities) {
      res.render('up_activities', {
        activity: activities,
        user: req.session.theUser,
      });
    });
  }
});

// Route to start a new activity
app.get('/new_activity', function(req, res) {
  const val_errors = req.session.errors;
  const ex_errors = req.session.ex_errors;
  const req_body = req.session.data;
  delete req.session.data;
  delete req.session.errors;
  delete req.session.ex_errors;


  if (!req.session.theUser) {
    res.redirect('/login');
  } else {
    if(req.session.update_activity){
      const update_activity = req.session.update_activity;
      delete req.session.update_activity;
      req.session.updateActivity = {
        activity_host_id:update_activity.activity_host_id,
        activity_id: update_activity.activity_id
      }
      req.session
      res.render('new_activity', {
        user: req.session.theUser,
        errors: val_errors,
        ex_errors: ex_errors,
        req_body: update_activity
      });
    }
    else{
      res.render('new_activity', {
        user: req.session.theUser,
        errors: val_errors,
        ex_errors: ex_errors,
        req_body: req_body
      });
    }
  }
});

// Route to post newly generated activity to the up_activities page
app.post('/up_activities', urlencodedParser,
[
  check('activity_topic')
    .not()
    .isEmpty()
    .withMessage('Must not be empty.')
    .isAlpha()
    .withMessage('Must be only alphabetical characters.')
    .trim(),
  check('activity_name')
    .not()
    .isEmpty()
    .withMessage('Must not be empty.'),
  check('activity_host')
    .not()
    .isEmpty()
    .withMessage('Must not be empty.')
    .trim(),
  check('activity_date')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Must not be empty.'),
  check('activity_time')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Must not be empty.'),
  check('activity_loc')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Must not be empty.'),
  check('activity_details')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Must not be empty.')
], function(req, res) {
  // // // // console.log(req.body);
  const val_errors = validationResult(req);
  if (val_errors.isEmpty()){
    if(req.session.updateActivity){
      const activity_id = req.session.updateActivity.activity_id;
      const user_id = req.session.updateActivity.activity_host_id;

      activityDB.update_user_created_activity(user_id,activity_id,req.body).then(function(updated) {
        activityDB.get_one_Activity(activity_id).then(function(activity) {
            activityDB.update_user_profile(activity).then(()=>{
              userDB.get_User_Profile(req.session.theUser.user_id).then(function(user) {
                req.session.theUser = user;
                // // // // console.log("Rinkiya ke papa",req.session.theUser.activity_rsvp);
                res.redirect('/up_activities');
              });

            }).catch(err => console.error(err))
        });
      });
    }
    else{
      const userId = req.session.theUser.user_id;
      const activity_id = new Date().valueOf().toString();
      activityDB.save_user_created_activity(userId, activity_id, req.body).then(function(added) {
        res.redirect('/up_activities');
      })
    }
  }
  else{
    req.session.errors = val_errors.array();
    req.session.data = req.body;
    res.redirect('/new_activity');
  }

});

// Route for updating user created activities
app.post('/update_activities', urlencodedParser, function(req, res) {
  // // // // console.log(req.body);
  // // // // console.log(req.session.theUser);
  if (req.session.theUser){
    const activity_id = req.body.activity_id;
    const user_id = req.session.theUser.user_id
    if (req.body.user_action ==='Delete'){
      activityDB.get_one_Activity(activity_id).then(function(activity) {
        activityDB.delete_user_created_activity(user_id,activity_id).then(() => {
          activityDB.deleteActivityEverywhere(activity).then(()=>{
            userDB.get_User_Profile(req.session.theUser.user_id).then(function(user) {
              req.session.theUser = user;
              // // // // console.log("Rinkiya ke papa delete hogaye",req.session.theUser.activity_rsvp);
              res.redirect('/up_activities');
            }).catch(err => console.error(err));


          }).catch(err => console.error(err));

        }).catch(err => console.error(err));
      })
    }
    else if (req.body.user_action === 'Update') {
      activityDB.get_one_Activity(activity_id).then(function(activity) {
        req.session.update_activity = activity;
        // // // // console.log(req.session);
        res.redirect('/new_activity');
      })
      // req.session.activity
    }
  }
  else{
    res.redirect('/saved_activities');
  }

  // res.send("console")
});

// Route for displaying activity details
app.get('/activity_detail', function(req, res) {
  // This condition checks if the request query consists only of activity_id.
  if (req.query.activity_id && Object.keys(req.query).length === 1) {
    activityDB.get_all_act_id().then(function(act_ids) {
      var all_act_ids = [];
      act_ids.forEach(function(obj) {
        all_act_ids.push(obj.activity_id);
      });
      if (all_act_ids.includes(req.query.activity_id)) {
        activityDB
          .get_one_Activity(req.query.activity_id)
          .then(function(one_act) {
            res.render('activity_detail', {
              activity: one_act,
              user: req.session.theUser,
            });
          });
      } else {
        activityDB.get_up_Activities().then(function(activities) {
          res.render('up_activities', {
            activity: activities,
            user: req.session.theUser,
          });
        });
      }
    });
  }
  // If no request query parameter then show the activity catalog.
  else {
    activityDB.get_up_Activities().then(function(activities) {
      res.render('up_activities', {
        activity: activities,
        user: req.session.theUser,
      });
    });
  }
});

// Route for rendering contact page
app.get('/contact', function(req, res) {
  res.render('contact', {user: req.session.theUser});
});

// Route for rendering about page
app.get('/about', function(req, res) {
  res.render('about', {user: req.session.theUser});
});

// Route for user login
app.get('/login', function(req, res) {
  // // // // console.log(req.session.ex_errors);
  const val_errors = req.session.errors;
  const ex_errors = req.session.ex_errors;
  const req_body = req.session.data;
  delete req.session.errors;
  delete req.session.ex_errors;
  delete req.session.data;
  res.render('login', {
    user: req.session.theUser,
    errors: val_errors,
    ex_errors: ex_errors,
    req_body: req_body
  });
});

// Route for handling user registration
app.post(
  '/signIn',
  urlencodedParser,
  [
    check('user_id')
      .not()
      .isEmpty()
      .withMessage('Must not be empty.')
      .isEmail()
      .withMessage('Must be a valid email address.'),
    check('password')
      .not()
      .isEmpty()
      .withMessage('Must not be empty.')
      .isLength({min: 6})
      .withMessage('Length must be minimum 6.'),
  ],
  function(req, res) {
    const val_errors = validationResult(req);
    if (val_errors.isEmpty()) {
      // return res.status(422).json({ errors: val_errors.array() });
      userDB.get_User(req.body.user_id).then(function(user) {
        // Pehle sanitize and validate input
        // if user is not present, no matches, user doesnt exist
        // // // // console.log(user);
        if (user) {
          const salt = user.password.salt;
          const pwd_obj = sha512(req.body.password, salt);
          if (user.password.passwordHash === pwd_obj.passwordHash) {
            req.session.user_id = user.user_id;
            res.redirect('/saved_activities');
          }
          // if no password match
          else {
            req.session.ex_errors = 'Incorrect Credentials. Please Try again.';
            res.redirect('/login');
          }
        }
        // if user is not present
        else {
          req.session.ex_errors = 'Incorrect Credentials. Please Try again.';
          res.redirect('/login');
        }
      });
    } else {
      req.session.errors = val_errors.array();
      // // // // console.log(req.session.errors);
      req.session.data = req.body;
      res.redirect('/login');
      // res.status(422).json({ errors: val_errors.array() });
    }
  },
);

// Route for rendering user registration form
app.get('/register', function(req, res) {
  // // // // console.log(req.session.errors);
  const val_errors = req.session.errors;
  const ex_errors = req.session.ex_errors;
  const req_body = req.session.data;
  // // // // console.log(req_body);
  // // // // console.log(val_errors);
  // // // // console.log(ex_errors);
  delete req.session.errors;
  delete req.session.ex_errors;
  delete req.session.data;
  res.render('register', {
    user: req.session.theUser,
    errors: val_errors,
    ex_errors: ex_errors,
    req_body: req_body
  });
});

// Route for handling user registration and creating a new user
app.post(
  '/user_registered',
  urlencodedParser,
  [
    check('first_name')
      .not()
      .isEmpty()
      .withMessage('Must not be empty.')
      .isAlpha()
      .withMessage('Must be only alphabetical characters.')
      .trim(),
    check('last_name')
      .not()
      .isEmpty()
      .withMessage('Must not be empty.')
      .isAlpha()
      .withMessage('Must be only alphabetical characters'),
    check('user_id')
      .trim()
      .not()
      .isEmpty()
      .withMessage('Must not be empty.')
      .isEmail()
      .withMessage('Must be a valid email address.'),
    check('address_1')
      .trim()
      .not()
      .isEmpty()
      .withMessage('Must not be empty.'),
    check('address_2')
      .trim()
      .not()
      .isEmpty()
      .withMessage('Must not be empty.'),
    check('city')
      .trim()
      .not()
      .isEmpty()
      .withMessage('Must not be empty.')
      .isAlpha()
      .withMessage('Must be only alphabetical characters'),
    check('state')
      .trim()
      .not()
      .isEmpty()
      .withMessage('Must not be empty.'),
    check('zipcode')
      .trim()
      .not()
      .isEmpty()
      .withMessage('Must not be empty.')
      .isNumeric()
      .withMessage('Must be only numerical value.'),
    check('country')
      .trim()
      .not()
      .isEmpty()
      .withMessage('Must not be empty.')
      .isAlpha()
      .withMessage('Must be only alphabetical characters'),
    check('password')
      .trim()
      .not()
      .isEmpty()
      .withMessage('Must not be empty.')
      .isLength({min: 6})
      .withMessage('Length must be minimum 6.'),
  ],
  function(req, res) {
    const errors = validationResult(req);
    // // // // console.log(req.body);
    if (errors.array().length === 0) {
      // // // // console.log("idhar aya");
      const user_details = req.body;
      userDB.get_User(user_details.user_id).then(function(user) {
        if (!user) {
          const salt = genRandomString(20);
          const pwd_obj = sha512(user_details.password, salt);
          user_details.password = pwd_obj;
          userDB.add_user_Details(req.body).then(function(result) {
            const prof_init = {
              user_id: result.user_id,
              first_name: result.first_name,
              last_name: result.last_name,
            };
            userDB.initialize_UserProfile(prof_init).then(function(prof) {
              req.session.user_id = prof.user_id;
              res.redirect('/saved_activities');
            });
          });
        } else {
          // res.redirect('register');
          req.session.ex_errors = 'User already registered. Please log in.';
          res.redirect('/register');
        }
      });
    } else {
      req.session.errors = errors.array();
      req.session.data = req.body;
      res.redirect('/register');
    }
  },
);

// route for handling logout
app.get('/logout', function(req, res) {
  if (req.session.theUser) {
    delete req.session.theUser;
  }
  if (req.session.activities) {
    delete req.session.activities;
  }
  res.redirect('/');
});

// If there are any requests other than above then show the landing page by default
app.get('/*', function(req, res) {
  res.render('index', {user: req.session.theUser});
});

app.listen(8080);
