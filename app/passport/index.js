// Load all the things we need
const LocalStrategy = require('passport-local').Strategy;

// Load the crypto module
const crypto = require('crypto');

// Load the nodemailer to send emails
const nodemailer = require('nodemailer');

// Load the user schema from the models to cominicate with the database
const User = require('../models/user');

module.exports = function(passport) {
  // ===============================================
  // Passport session setup 
  // ===============================================

  // Used to serialize the user for the session
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  // Used to deserialize the user
  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });


  // Local signin strategy
  passport.use('local-sign-in', new LocalStrategy({
    // By default, local strategy uses username and password, we will override with email
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is signed in or not)
  },
  function (req, email, password, done) {
    if (email)
      email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching
    // asynchronous
    
    process.nextTick(function () {
      User.findOne({
        'email': email
      }, 
      function (err, user) {
        // if there are any errors, return the error
        if (err) return done(err);

        // if no user is found, return the message
        else if (!user) {
          return done(null, false, req.flash('sign-in-msg', 'No user found'));
        }

        // if password is invalid, return message
        else if (!user.isValidPassword(password)) {
          return done(null, false, req.flash('sign-in-msg', 'Oops! Wrong password'));
        }

        // if email hasn't been confirmed, return message
        else if (!user.isEmailConfirmed()) {
          return done(null, false, req.flash('sign-in-msg', 'Your email has not been confirmed yet'));
        }

        // all is well, return user
        else return done(null, user);
      });
    });
  }));

  // Local signup strategy
  passport.use('local-sign-up', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is signed in or not)
  },
  function (req, email, password, done) {
    if (email) email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching
    // asynchronous
    process.nextTick(function () {
      // if the user is not already signed in:
      if (!req.user) {
        User.findOne({
          'email': email
        },
        function (err, user) {
          // if there are any errors, return the error
          if (err) return done(err);

          // Check to see if theres already a user with that email
          if (user) {
            return done(null, false, req.flash('sign-up-msg', 'That email is already taken'));
          }

          // Check if passwords match
          else if (password !== req.body.password_confirmation) {
            return done(null, false, req.flash('sign-up-msg', 'Passwords do not match'));
          }

          // if everything is good register the user information and wait for email verification
          else {
            // Create an email token
            let emailHash = crypto.randomBytes(20).toString("hex");

            // Create the user
            let newUser = new User();
            newUser.email = email;
            newUser.password = newUser.generateHash(password);
            newUser.name = req.body.name;
            newUser.birthday = req.body.birthday;
            newUser.isEmailConfirmed = false;
            newUser.emailConfirmationToken = emailHash;

            newUser.save(function (err) {
              if (err) {
                return done(err);
              }

              let smtpTransport = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'fviclass@gmail.com',
                  pass: 'fviclass2017'
                }
              });

              let mailOptions = {
                to: email,
                from: 'Blog',
                subject: 'Hi ' + newUser.name + ', here is your email verification',
                text: "Please click in link below to confirm your email or copy and paste in your browser url bar \n\n http://" + req.headers.host + "/email-confirmation/" + emailHash,
                html:` 
                <p>
                  Please click in the link below to <br/>
                  <a href='http://${req.headers.host}/email-confirmation/${emailHash}'> 
                    confirm your email address
                  </a>
                </p>`
              };

              smtpTransport.sendMail(mailOptions);
              //Sets it to false to redirect the user to the login page.
              return done(null, newUser, req.flash('sign-in-msg', 'A verification email has been sent to ' + email));
            });
          }
        });
      // if the user is signed in but has no local account...
      } else {
        // User is signed in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)

        return done(null, req.user);
      }
    });
  }));

  // Local update strategy
  passport.use('local-profile-update', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
  },
  function (req, email, password, done) {
    if (email) email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching
    // asynchronous
    process.nextTick(function () {
      // if the user is not already logged in:
      if (!req.user) {
        return done(null, false, req.flash('update-profile-msg', 'You must be logged in to update your profile information'));
      }

      // if password is invalid, return message
      else if (!req.user.isValidPassword(password)) {
        return done(null, false, req.flash('update-profile-msg', 'Oops! Wrong password'));
      }

      else {
        let user = req.user;
        if (req.body.new_password && req.body.new_password_confirmation && req.body.new_password === req.body.new_password_confirmation) {
          user.password = user.generateHash(req.body.new_password);
        }

        user.name = req.body.name;
        user.birthday = req.body.birthday;

        user.save(function (err) {
          if (err)
            return done(err);

          return done(null, user, req.flash('update-profile-msg', 'Profile updated successfully!'));
        });
      }
    });
  }));
}