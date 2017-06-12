import express from 'express';
const router = express.Router();
import async from 'async';
import db from '../db.js';
import authCheck from '../authCheck.js';
const auth = authCheck.auth;

router.get('/', auth, (req, res, next) => {
  async.waterfall([done => {
    db.query('SELECT * FROM "notifications" WHERE "ownerEmail"  = $1', [req.session.user.email.toLowerCase()], done);
  }, (result, done) => {
    const sortedRows = result.rows.sort((a, b) => a.timestamp < b.timestamp);
    res.render('notifications', {
      notifications: sortedRows
    });
  }
  ], err => {
    if (err) return next(err);
  });
});

export default router;
