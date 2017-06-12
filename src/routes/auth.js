import express from 'express';
const router = express.Router();
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import async from 'async';
import db from '../db.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import UserTypes from '../constants/UserTypes.js';
const stripe = require("stripe")("sk_test_4L6BgnfhZmqt7BOhhq00i9mG");

router.get('/login', (req, res, next) => {
  res.render('login');
});

router.post('/login', (req, res, next) => {
  User.login(req.body, (err, result, isValid) => {
    if (err) return next(err);

    if (isValid) {
      req.session.user = result.rows[0]
      if (req.query.redirect) {
        res.redirect(req.query.redirect)
      } else {
        res.redirect('/');
      }
    } else {
      res.render('login', {
        errors: ['Invalid Password'],
        email: req.body.email
      })
    }
  });
});

router.get('/logout', (req, res, next) => {
  req.session.user = null;
  res.redirect('/');
});

router.get('/signup', (req, res, next) => {
  res.render('signup');
});

router.post('/signup', (req, res, next) => {
  User.signup(req.body, (err, user) => {
    if (err) {
      res.render('signup', {
        errors: [err]
      })
    } else {
      req.session.user = user
      stripe.customers.create({
        email: req.session.user.email
      }).then(customer => {
        User.setStripeCustomerId(customer.id, req.session.user.id, (err, unused) => {
          // done(err, result, charge);
          if(err) {
            res.render('signup', {
              errors: [err]
            })
          } else {
            res.redirect('/');
          }
        });
      }).catch(err => {
        // done(err);
        res.render('signup', {
          errors: [err]
        })
      });

    }
  });
});

router.get('/forgot', (req, res, next) => {
  res.render('forgot');
});

router.get('/forgot/:token', (req, res, next) => {
  async.waterfall([done => {
    User.getByResetPasswordToken(req.params.token, done);
  }, (result, done) => {
    if (result.rows.length == 0) {
      done('Invalid Token')
    } else if (result.rows[0].resetPasswordTokenExpiration < Date.now()) {
      done('Link has expired. Please try resetting again.')
    } else {
      res.render('password-recovery')
    }
  }
  ], err => {
    res.render('password-recovery', {
      errors: [err]
    })
  });
});

router.post('/forgot/:token', (req, res, next) => {
  let email;
  async.waterfall([done => {
    User.getByResetPasswordToken(req.params.token, done);
  }, (result, done) => {
    email = result.rows[0].email;
    bcrypt.genSalt(10, (err, salt) => {
      done(err, salt)
    });
  }, (salt, done) => {
    bcrypt.hash(req.body.password, salt, (err, hash) => {
      done(err, salt, hash)
    });
  }, (salt, hash, done) => {
    User.resetPassword(salt, hash, req.params.token, done);
  }, (salt, hash, done) => {
    req.session.user = {
      email,
      salt,
      passwordHash: hash
    };
    res.redirect('/');
  }
  ], err => {
    res.render('password-recovery', {
      errors: [err]
    })
  });
});


router.post('/forgot', (req, res, next) => {
  async.waterfall([done => {
    crypto.randomBytes(20, (err, buf) => {
      const token = buf.toString('hex');
      done(err, token);
    });
  }, (token, done) => {
    User.get(req.body.email.toLowerCase(), (err, result) => {
      done(err, result, token)
    });
  }, (result, token, done) => {
    if (result.rows.length == 0) {
      done('Email not found')
    } else {
      User.setResetPasswordToken(req.body.email, token, done);
    }
  }, (token, done) => {
    new Notification({
      'ownerEmail': req.body.email,
      subject: 'Reset Your Password',
      text: `http://${req.headers.host}/auth/forgot/${token}`
    }).push(done)
  }, done => {
    res.render('forgot-done');
  }
  ], err => {
    res.render('forgot', {
      errors: [err]
    })
  })
});




export default router;
