import jwt from 'jsonwebtoken';
import UserTypes from "./constants/UserTypes.js";
import app from './app.js';

function authScope(req, res, next, types) {
  // CHECK THE USER STORED IN SESSION
  if (req.session.user && types.indexOf(req.session.user.type.trim()) != -1)
    return next();

  // IF A USER ISN'T LOGGED IN, THEN REDIRECT THEM TO THE LOGIN PAGE
  res.status(403).send("You are not authorized to view this page");
}

export default {
  veteranAuth(req, res, next) {
    return authScope(req, res, next, [UserTypes.VETERAN, UserTypes.ADMIN]);
  },
  guardAuth(req, res, next) {
    return authScope(req, res, next, [UserTypes.GUARD, UserTypes.ADMIN]);
  },
  adminAuth(req, res, next) {
    return authScope(req, res, next, [UserTypes.ADMIN]);
  },
  auth(req, res, next) {
    // CHECK THE USER STORED IN SESSION
    if (req.session.user)
    {
      return next();
    }

    // IF A USER ISN'T LOGGED IN, THEN REDIRECT THEM TO THE LOGIN PAGE
    res.redirect(`/auth/login?redirect=${req.originalUrl}`);
  },

  apiAuth(req, res, next) {
    // check header or url parameters or post parameters for token
    const token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {

      // verifies secret and checks exp
      jwt.verify(token, app.get('secret'), (err, decoded) => {
        if (err) {
          return res.json({ success: false, message: 'Failed to authenticate token.' });
        } else {
          // if everything is good, save to request for use in other routes
          req.decoded = decoded;
          next();
        }
      });

    } else {

      // if there is no token
      // return an error
      return res.status(403).send({
        success: false,
        message: 'No token provided.'
      });

    }
  }
};
