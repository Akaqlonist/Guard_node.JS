import express from 'express';
const router = express.Router();
import async from 'async';
import db from '../db.js';
import authCheck from '../authCheck.js';
const auth = authCheck.auth;
const guardAuth = authCheck.guardAuth;
import Guard from '../models/Guard';
import BookingRequest from '../models/BookingRequest';

router.get('/', [auth, guardAuth], (req, res, next) => {
  async.waterfall([
    done => {
      Guard.getByUserId(req.session.user.id, done)
    },
    (result, done) => {
      BookingRequest.getAllAssigned(result.rows[0].id, (err, assignedResult) => {
        done(err, result.rows[0], assignedResult);
      });
    },
    (guard, assignedResult, done) => {
      BookingRequest.getAllNearbyUnassigned(guard, (err, result) => {
        done(err, guard, assignedResult, result);
      })
    },
    (guard, assignedResult, unassignedResult, done) => {
      res.render('shifts', {guard, assigned: assignedResult.rows, unassigned: unassignedResult.rows});
    }
  ], err => next(err))
});

export default router;
