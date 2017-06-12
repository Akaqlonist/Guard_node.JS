import express from 'express';
const router = express.Router();
import db from '../../db.js';
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import UserTypes from '../../constants/UserTypes.js';
import basicAuth from 'basic-auth';
const stripe = require("stripe")("sk_test_4L6BgnfhZmqt7BOhhq00i9mG");

function sign(user) {
  return jwt.sign(user, app.get('secret'), {
    expiresIn: 24 * 60 * 60 * 50 // expires in 24 hours
  });
}

router.post('/', (req, res, next) => {
  const parsed = basicAuth(req);
  User.login({
    email: parsed.name,
    password: parsed.pass
  }, (err, result, isValid, done) => {
    if (isValid) {
      const token = sign(result.rows[0]);
      var userObj = result.rows[0];
      var userDict = {
        email:parsed.name,
        firstName:userObj.firstName,
        lastName: userObj.lastName,
        phoneNumber: userObj.phoneNumber,
        userType: userObj.type,
        stripeCustomerId: userObj.stripeCustomerId
      };
      res.json({
        success: true,
        token: token,
        userInfo: userDict
      });
    } else {
      res.json({
        success: false,
        message: 'Authentication failed. Wrong password.'
      });
    }
  })
});

router.post('/signup', (req, res, next) => {
  User.signup(req.body, (err, user) => {
    if (err) {
      res.json({
        success: false,
        message: `Signup failed: ${err}`
      });
    } else {
      stripe.customers.create({
        email: user.email
      }).then(customer => {
        User.setStripeCustomerId(customer.id, user.email, (err, unused) => {
          console.log('Set customer id to ' + customer.id);
          if (err) {
            console.log('Error settings customer id ' + err);
           res.json({
            success: false,
            message: `Signup failed: ${err}`
          });
         } else {
          const token = sign(user);
          res.json({
            success: true,
            token:token
          });
        }
      });
      })
    }
  });
});

router.get('/test', (req,res,next) => {
  res.json({
    success: true,
    message: `Testing Signup page`
  });
});

export default router;
