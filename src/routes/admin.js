import express from 'express';
const router = express.Router();
import async from 'async';
import bcrypt from 'bcrypt';
import db from '../db.js';
import authCheck from '../authCheck.js';
const auth = authCheck.auth;
const adminAuth = authCheck.adminAuth;
import User from '../models/User.js';
import BookingRequest from '../models/BookingRequest.js';
import Guard from '../models/Guard.js';

router.get('/', [auth, adminAuth], (req, res, next) => {
  res.send("not supposed to see this");
});

router.get('/guards', [auth, adminAuth], (req, res, next) => {
  async.waterfall([
    done => {
      Guard.getAll(done);
    },
    (result, done) => {
      res.render('admin/guards', {guards: result.rows});
    }
  ], err => next(err))
});

router.get('/shifts', [auth, adminAuth], (req, res, next) => {
  async.waterfall([
    done => {
      BookingRequest.getAll(done);
    },
    (requestResults, done) => {
      Guard.getAll((err, result) => {
        done(err, requestResults, result)
      });
    },
    (requestResults, guardResults, done) => {
      const guardMap = guardResults.rows.reduce((total, current) => {
          total[ current.id ] = current;
          return total;
      }, {});

      res.render('admin/shifts', {requests: requestResults.rows, guards: guardMap});
    }
  ], err => next(err))
});

router.get('/guards/create', [auth, adminAuth], (req, res, next) => {
  res.render('admin/create-guard');
});

router.post('/guards/create', [auth, adminAuth], (req, res, next) => {
 const body = req.body;
 const email = body.email.toLowerCase();
 async.waterfall([
    done => {
      User.get(email, done);
    },
    (result, done) => {
      if (result.rows.length == 0) {
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(req.body.password, salt, (err, hash) => { done(err, null, salt, hash)});  
        });
      } else {
        done(null, result, null, null)
      }
    },
    (result, salt, hash, done) => {
      if (result && result.rows.length > 0) {
        Guard.getByUserId(result.rows[0].id, (err, result) => {
          done(null, userId, result.rows.length > 0);
        }); 
      } else {
        User.createGuard(email, salt, hash, body, (err, result, salt, hash) => { done(err, result.id, false);});
      }
    },
    (userId, guardExists, done) => {
      if (guardExists) {
        done("There is already a guard for this email");
      } else {
        Guard.create(body, userId, done)
      }
    },
    done => {
      res.redirect('/admin/guards');
    }
   ], err => {
    if (err) {
      res.render('admin/create-guard', {guard: body, errors: [err]});
    }
  });
});

router.get('/guards/:id', [auth, adminAuth], (req, res, next) => {
 async.waterfall([
    done => {
      Guard.get(req.params.id, done);
    },
    (result, done) => {
      res.render('admin/create-guard', {guard: result.rows[0]});
    }
  ], err => next(err))
 
});

router.post('/guards/:id', [auth, adminAuth], (req, res, next) => {
 async.waterfall([
    done => {
      Guard.update(req.body, req.params.id, done);
    },
    (result, done) => {
      User.update(req.body, req.body.userId, done);
    },
    (result, done) => {
      res.redirect('/admin/guards');
    }
  ], err => next(err))
 
});


export default router;
