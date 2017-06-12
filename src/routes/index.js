import express from 'express';
const router = express.Router();
import async from 'async';
import db from '../db.js';
import authCheck from '../authCheck.js';
const auth = authCheck.auth;
import BookingRequest from '../models/BookingRequest';
import User from '../models/User';

router.get('/', [auth], (req, res, next) => {
  async.waterfall([
    done => {
      BookingRequest.getPastAndUpcomingRequests(req.session.user.id, done);
    },
    (upcomingRequests, pastRequests, done) => {
      res.render('index', {
        upcomingRequests,
        pastRequests
      });
    }
    ], err => {
      if (err) return next(err);
    });
});

router.get('/pricing', (req, res, next) => {
   res.render('pricing')
});

router.get('/about', (req, res, next) => {
   res.render('about')
});

router.get('/contact', (req, res, next) => {
   res.render('contact')
});


router.get('/settings', [auth], (req, res, next) => {
  async.waterfall([
    done => {
      User.getById(req.session.user.id, done)
    },
    (results, done) => {
      res.render('settings', {user: results.rows[0]});
    }
  ], err => {
    if (err) return next(err);
  });
});

router.post('/settings', [auth], (req, res, next) => {
  async.waterfall([
    done => {
      User.update(req.body, req.session.user.id, done)
    },
    done => {
      res.redirect('/settings');
    }
    ], err => {
      if (err) return next(err);
    });
});

router.get('/app', (req, res, next) => {
  res.redirect('/auth/signup');

});

router.get('/nav', (req, res, next) => {
  async.waterfall([done => {
    const currentTime = new Date().getTime();
    db.query('SELECT * FROM "bookingRequests" WHERE "userId" = $1 AND "fromTimestamp" > $2', [req.session.user.id, currentTime], done);
  }, (result, done) => {
    res.send({
      upcomingCount: result.rows.length,
    });
  }
  ], err => {
    if (err) return next(err);
  });
});

export default router;
