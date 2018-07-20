// Load async to process the email confirmation
const asynq = require('async');

// Load the crypto module
const crypto = require('crypto');

// Load the nodemailer to send emails
const nodemailer = require('nodemailer');

// Load the user schema from the models to cominicate with the database
const User = require('../models/user');

module.exports = function (app, passport, isLoggedIn) {
  // Handle sign-up
  app.post('/sign-up', passport.authenticate('local-sign-up', {
    successRedirect: '/sign-in', // redirect to signin page
    failureRedirect: '/sign-up', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // Handle sign-in
  app.post('/sign-in', passport.authenticate('local-sign-in', {
    successRedirect: '/home', // redirect to the secure home page
    failureRedirect: '/sign-in', // redirect back to the signin page if there is an error
    failureFlash: true // allow flash messages
  }));

  // Handle profile update
  app.post('/update-profile', passport.authenticate('local-profile-update', {
    successRedirect: '/update-profile',
    failureRedirect: '/update-profile',
    failureFlash: true // allow flash messages
  }));

  // Handle sign-out
  app.get('/sign-out', isLoggedIn, function (req, res) {
    req.logout();
    res.redirect('/');
  });

  // Handle the email confirmation
  app.get('/email-confirmation/:email_token', function (req, res) {
    let token = req.params.email_token;
    console.log(token);
    asynq.waterfall([
      function (done) {
        User.findOne({ 'emailConfirmationToken': token },
          function (err, user) {
            if (!user) {
              req.flash('sign-up-msg', 'No user found');
              return res.redirect('/sign-up');
            }

            //Set the isEmailConfirmed to true.
            user.emailConfirmed = true;
            user.emailConfirmationToken = undefined;

            user.save(function (err) {
              if (err) {
                req.flash('sign-up-msg', 'Database error')
                return res.redirect('/sign-up');
              }
              done(err, user);
            });
          }
        );
      },
      function (user, done) {
        let smtpTransport = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'fviclass@gmail.com',
            pass: 'fviclass2017'
          }
        });
        let mailOptions = {
          to: user.email,
          from: 'Email Confirmed',
          subject: 'Your email has been confirmed.',
          text: 'Hello ' + user.name + ',\n\n' +
            'This is a confirmation that the email for your account ' + user.email + ' has been confirmed.\n'
        };
        smtpTransport.sendMail(mailOptions);

        req.flash('sign-in-msg', 'Your email has been confirmed')
        return res.redirect('/sign-in');
      }
    ], 
    function (err) {
      if (err) return console.log(err);
      console.log('Email confirmed');
    });
  });

  // Handle password recovery
  app.post('/password-recovery', function (req, res, next) {
    asynq.waterfall([
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function (token, done) {
        User.findOne({ 'email': req.body.email }, function (err, user) {

          if (!user) {
            req.flash('passwordRecoveryMessage', 'No user found with that email.')
            return res.redirect('/password-recovery');
          }

          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          user.save(function (err) {
            done(err, token, user);
          });
        });
      },
      function (token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'fviclass@gmail.com',
            pass: 'fviclass2017'
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'Password Recovery',
          subject: 'Password Reset',
          html: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/password-reset/' + token + '\n\n' +
            'Verification Code: ' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };

        smtpTransport.sendMail(mailOptions, function (err) {
          req.flash('passwordRecoveryMessage', 'An e-mail has been sent to ' + user.email + ' with further instructions.')
          return res.redirect('/password-recovery');
          done(err, 'done');
        });
      }
    ], function (err) {
      if (err) return next(err);
      console.log('password reset email sent');
    });
  });

  app.get('/password-reset/:token', function (req, res) {
    User.findOne({ 'resetPasswordToken': req.params.token, 'resetPasswordExpires': { $gt: Date.now() } },
      function (err, user) {
        if (!user) {
          req.flash('password-recovery-msg', 'No user found with that email.');
          return res.redirect('/password-recovery');
        }
        else {
          req.flash('passwordResetMessage', 'You can now change your password')
          res.render('password_reset.ejs', { message: req.flash('password-reset-msg') });
        }

      });
  });

  app.post('/password-reset/:token', function (req, res) {
    asynq.waterfall([
      function (done) {
        User.findOne({
          'resetPasswordToken': req.params.token, 'resetPasswordExpires': { $gt: Date.now() }
        },
          function (err, user) {
            if (!user) {
              req.flash('passwordRecoveryMessage', 'No user found with that email.')
              return res.redirect('/password-recovery');
            }
            else if (req.body.new_password !== req.body.new_password_confirmation) {
              
              res.render('password_reset', { message: req.flash('password-reset-msg', 'Passwords do not match.') });
            }
            else {
              user.password = user.generateHash(req.body.new_password);
              user.resetPasswordToken = undefined;
              user.resetPasswordExpires = undefined;

              user.save(function (err) {
                console.log(err);
                // if you want the user to log in automatically uncomment the following code 
                // req.logIn(user, function (err) {
                //   done(err, user);
                // });
              });
            }
          });
      },
      function (user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'fviclass@gmail.com',
            pass: 'fviclass2017'
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'Password Changed',
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          req.flash('sign-in-msg', 'Your password was succesfully reseted');
          res.redirect('/sign-in');
          done(err);
        });
      }
    ], function (err) {
      console.log('password changed');
    });
  });
}