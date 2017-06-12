import express from 'express';
import async from 'async';
import authCheck from '../../authCheck.js';
import Guard from '../../models/Guard.js';
import BookingRequest from '../../models/BookingRequest';
const stripe = require("stripe")("sk_test_4L6BgnfhZmqt7BOhhq00i9mG");
const router = express.Router();
const apiAuth = authCheck.apiAuth;

router.get('/', [apiAuth], (req, res, next) => {
  async.waterfall([done => {
    BookingRequest.getPastAndUpcomingRequests(req.decoded.id, done);
  }, (upcomingRequests, pastRequests, done) => {
    res.json({
      upcomingRequests,
      pastRequests
    });
  }
  ], err => {
    if (err) return next(err);
  });
});

router.get('/:id', [apiAuth], (req, res, next) => {
  async.waterfall([done => {
    BookingRequest.get(req.params.id, req.decoded.id, done);
  }, (result, done) => {
    res.json(result.rows[0]);
  }
  ], err => {
    if (err) return next(err);
  });
});


router.post('/create', [apiAuth], (req, res, next) => {
  const body = req.body;
  async.waterfall([
    done => {
      BookingRequest.create(body, req.decoded.id, done);
    },
    (result, done) => {
      res.json({
        success: true,
        requestId: result.rows[0].id
      });
    }
  ], err => {
    res.json({
      success: false,
      error: err
    });
  });
});

router.post('/payment/charge', [apiAuth], (req, res, next) => {
  const body = req.body;
  async.waterfall([
    done => {
      BookingRequest.setStripeChargeId(req.query.id, req.body.chargeId, done);
    },
    (result, done) => {
      res.json({
        success: true
      });
    }
  ], err => {
    res.json({
      success: false,
      error: err
    });
  });
});


export default router;
