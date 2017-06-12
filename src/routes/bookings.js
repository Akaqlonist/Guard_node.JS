import jade from 'jade';
import express from 'express';
const router = express.Router();
import async from 'async';
import db from '../db.js';
import authCheck from '../authCheck.js';
const auth = authCheck.auth;
const guardAuth = authCheck.guardAuth;
import Notification from '../models/Notification.js';
import Guard from '../models/Guard.js';
import User from '../models/User.js';
const stripe = require("stripe")("sk_test_4L6BgnfhZmqt7BOhhq00i9mG");
import costCalculator from '../util/costCalculator.js';
import BookingRequest from '../models/BookingRequest';

router.get('/create', auth, (req, res, next) => {
  res.render('bookings');
});

router.post('/create', auth, (req, res, next) => {
  const body = req.body;
  console.log(body);
  BookingRequest.create(body, req.session.user.id, (err, result) => {
    if(err) {
      console.log("ERROR CREATING BOOKING: " + err);
    }
    res.redirect(`payment?id=${result.rows[0].id}`);
  });
});

router.get('/payment', auth, (req, res, next) => {
  async.waterfall([
    done => {
      BookingRequest.get(req.query.id, req.session.user.id, done);
    },
    (result, done) => {
      res.render('payment', {
        id: req.query.id,
        request: result.rows[0]
      });
    }], err => {
    if (err) return next(err);
  }
  );
});

router.post('/payment', auth, (req, res, next) => {
  async.waterfall([
    done => {
      BookingRequest.get(req.query.id, req.session.user.id, done);
    },
    (result, done) => {
      // Set your secret key: remember to change this to your live secret key in production
      // See your keys here: https://dashboard.stripe.com/account/apikeys
      var promise;
      if (req.session.user.stripeCustomerId) {
        promise = stripe.customers.update(req.session.user.stripeCustomerId, {
          card: req.body.stripeToken,
        });
      } else {
        promise = stripe.customers.create({
          card: req.body.stripeToken,
          email: req.session.user.email
        });
      }
      promise.then(customer => stripe.charges.create({
        amount: costCalculator(result.rows[0]), // Amount in cents
        currency: 'usd',
        customer: customer.id
      })).then(charge => {
        req.session.charge = charge;
        User.setStripeCustomerId(charge.customer, req.session.user.id, (err, unused) => {
          done(err, result, charge);
        });
      }).catch(err => {
        done(err);
      });
    },
    (result, charge, done) => {
      BookingRequest.setStripeChargeId(req.query.id, charge.id, (err, unused) => {
        done(err, result, charge);
      });
    },
    (result, charge, done) => {
      const html = jade.renderFile('build/views/confirmation-email.jade', {
        moment: require('moment'),
        request: result.rows[0],
        charge: req.session.charge
      });
      new Notification({
        ownerEmail: req.session.user.email,
        subject: 'Booking confirmed',
        text: html
      }).push(() => {
        done(null, result);
      });
    },
    (result, done) => {
      Guard.findNearbyGuards(result.rows[0].fromLat, result.rows[0].fromLong, (err, guardResult) => {
        done(err, result, guardResult)
      })
    },
    (result, guardResult, done) => {
      const guards = guardResult.rows;
      if (guards.length > 0) {
        const html = jade.renderFile('build/views/new-nearby-booking-email.jade', {
          moment: require('moment'),
          baseUrl: `http://${req.headers.host}`,
          request: result.rows[0],
        });
        const cbs = [];
        for (const i in guards) {
          console.log(i)
          const notification = new Notification({
            ownerEmail: guards[i].email,
            subject: 'New booking available',
            text: html
          });
          cbs.push(notification.push.bind(notification));
        }

        async.series(cbs, done);
      } else {
        done(null);
      }
    },
    done => {
      res.redirect(`payment-confirmation?id=${req.query.id}`);
    }
  ], err => {
    if (err) res.json({'success': false, error: err})
  });
});

router.get('/payment-confirmation', auth, (req, res, next) => {
  async.waterfall([done => {
    BookingRequest.get(req.query.id, req.session.user.id, done);
  }, (result, done) => {
    const charge = req.session.charge;
    req.session.charge = null;
    res.render('payment-confirmation', {
      request: result.rows[0],
      charge
    });
  }
  ], err => {
    if (err) return next(err);
  });
});

router.get('/:id', auth, (req, res, next) => {
  async.waterfall([done => {
    BookingRequest.get(req.params.id, req.query.userId || req.session.user.id, done);
  }, (result, done) => {
    res.render('bookings', {
      request: result.rows[0]
    });
  }
  ], err => {
    if (err) return next(err);
  });
});

router.post('/:id', auth, (req, res, next) => {
  async.waterfall([done => {
    BookingRequest.get(req.params.id, req.query.userId || req.session.user.id, done);
  }, (result, done) => {
    const body = req.body;
    const fromTimestamp = new Date(`${body.fromDate} ${body.fromTime}`).getTime();
    const toTimestamp = new Date(`${body.toDate} ${body.toTime}`).getTime();
    const oldCost = costCalculator(result.rows[0]);
    const newCost = costCalculator({
      "fromTimestamp": body.fromTimestamp,
      "toTimestamp": body.toTimestamp,
      "armed": body.armed,
      "numberOfGuards": body.numberOfGuards,
    });

    //TODO: Handle refunds and surcharges
    if (newCost > oldCost) {

    }
    if (newCost < oldCost) {

    }
    BookingRequest.update(req.params.id, body, req.query.userId || req.session.user.id, (err, result) => {
      if (req.session.user.type.trim() == 'ADMIN') {
        res.redirect('/admin/shifts');
      } else {
        res.redirect('/');
      }
    });
  }
  ], err => {
    if (err) return next(err);
  });
});


router.patch('/:id/assign', [auth, guardAuth], (req, res, next) => {
  BookingRequest.assignGuard(req.params.id, req.body.guardId, (err, result) => {
    console.log(err);
    res.send({
      success: true
    });
  });
});

router.patch('/:id/unassign', [auth, guardAuth], (req, res, next) => {
  BookingRequest.unassignGuard(req.params.id, req.body.guardId, (err, result) => {
    res.send({
      success: true
    });
  });
});

router.delete('/:id', auth, (req, res, next) => {
  BookingRequest.delete(req.params.id, req.session.user.id, (err, result) => {
    res.send({
      success: true
    });
  });
});

export default router;
