import express from 'express';
const router = express.Router();
import async from 'async';
import db from '../../db.js';
import authCheck from '../../authCheck.js';
const apiAuth = authCheck.apiAuth;

const stripe = require("stripe")("sk_test_4L6BgnfhZmqt7BOhhq00i9mG");

router.get('/customer', [apiAuth], function(req, res) {
  var customerId = req.decoded.stripeCustomerId;
  console.log('DECODED: ' + Object.keys(req.decoded));
  console.log('Customer ID = ' + customerId)
  stripe.customers.retrieve(customerId, function(err, customer) {
    if (err) {
      console.log(err);
      res.status(402).send('Error retrieving customer.');
    } else {
      res.json(customer);
    }
  })
});

router.post('/customer/sources', [apiAuth], function(req, res) {
  var customerId = req.decoded.stripeCustomerId;
  var source = req.body.source;
  console.log('Source = ' + source);
  stripe.customers.createSource(customerId, {
    source: source
  }, function(err, source) {
    if (err) {
      console.log('Error Attaching Source: '+err);
      res.status(402).send('Error attaching source.');
    } else {
      res.status(200).end();
    }
  });
});

router.post('/customer/default_source', [apiAuth], function(req, res) {
  var customerId = req.decoded.stripeCustomerId;
  stripe.customers.update(customerId, {
    default_source: req.body.defaultSource
  }, function(err, customer) {
    if (err) {
      res.status(402).send('Error setting default source.');
    } else {
      res.status(200).end();
    }
  });
});

router.post('/charge', [apiAuth], function(req, res) {
  var source = req.body.source;
  var amount = req.body.amount;
  var customerId = req.decoded.stripeCustomerId;

  var charge = stripe.charges.create({
    amount: amount,
    currency: "usd",
    description: "VetGuards App Charge",
    source: source,
    customer: customerId
  }, function(err, charge) {
    if (err) {
      console.log('Error Completing Charge: '+err);
      res.status(402).send('Error Completing Charge');
    } else {
      res.status(200).end();
    }
  });
});

export default router;
