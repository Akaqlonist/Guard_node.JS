import express from 'express';
const router = express.Router();
import async from 'async';
import db from '../../db.js';
import authCheck from '../../authCheck.js';
const apiAuth = authCheck.apiAuth;
import Guard from '../../models/Guard';
import BookingRequest from '../../models/BookingRequest';

router.get('/', [apiAuth], (req, res, next) => {
  async.waterfall([
    done => {
      console.log("ID = " +req.decoded.id);
      Guard.getByUserId(req.decoded.id, done)
    },
    (result, done) => {
      if(result.rows.length <= 0) {
        res.json({
          success: false,
          error: 'No Results'
        });
        return;
      }
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
      res.json({
        guard,
        assigned: assignedResult.rows,
        unassigned: unassignedResult.rows
      });
    }
  ], err => res.json({
    success: false,
    error: err
  }))
});

router.get('/past', [apiAuth], (req, res, next) => {
  async.waterfall([
    done => {
      console.log("ID = " +req.decoded.id);
      Guard.getByUserId(req.decoded.id, done)
    },
    (result, done) => {
      if(result.rows.length <= 0) {
        res.json({
          success: false,
          error: 'No Results'
        });
        return;
      }
      BookingRequest.getPastAssigned(result.rows[0].id, done);
    },
    (result, done) => {
      res.json(result.rows);
    }
  ], err => res.json({
    success: false,
    error: err
  }))
});


router.patch('/:id/assign', [apiAuth], (req, res, next) => {
  async.waterfall([
    done => {
      Guard.getByUserId(req.decoded.id, done)
    },
    (result, done) => {
      BookingRequest.assignGuard(req.params.id, result.rows[0].id, done);
      console.log('Assinging Guard to: ' + req.params.id + " for: " + result.rows[0].id);
    },
    (result, done) => {
      res.json({
        success: true
      })
    }
  ], err => res.json({
    success: false,
    error: err
  }))

});

router.patch('/:id/unassign', [apiAuth], (req, res, next) => {
  async.waterfall([
    done => {
      Guard.getByUserId(req.decoded.id, done)
    },
    (result, done) => {
      BookingRequest.assignGuard(req.params.id, result.rows[0].id, done);
    },
    (result, done) => {
      res.json({
        success: true
      })
    }
  ], err => res.json({
    success: false,
    error: err
  }))
});

export default router;
