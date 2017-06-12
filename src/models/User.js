import Immutable from 'immutable';
import db from '../db.js';
import UserTypes from '../constants/UserTypes.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import async from 'async';
import Notification from './Notification.js';

const User = Immutable.Record({
  email: null,
  type: UserTypes.VETERAN,
  salt: null,
  passwordHash: null,
  firstName: null,
  lastName: null,
  phoneNumber: null,
  stripeCustomerId: null
});

User.get = (email, done) => {
  db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()], done);
}

User.getAll = (done) => {
  db.query('SELECT * FROM users', [], done);
}

User.getById = (id, done) => {
  db.query('SELECT * FROM users WHERE id = $1', [id], done);
}

User.create = (email, salt, hash, body, done) => {
  db.query('INSERT INTO public.users(email, salt, "passwordHash", "firstName", "lastName", "phoneNumber", type)  VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, salt, "passwordHash", "firstName", "lastName", "phoneNumber", type;',
    [email, salt, hash, body.firstName, body.lastName, body.phoneNumber, UserTypes.VETERAN], (err, result) => {
      done(err, result.rows[0])
    });
}

User.createGuard = (email, salt, hash, body, done) => {
  db.query('INSERT INTO public.users(email, salt, "passwordHash", "firstName", "lastName", "phoneNumber", type)  VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;',
    [email, salt, hash, body.firstName, body.lastName, body.phoneNumber, UserTypes.GUARD], (err, result) => {
      done(err, result.rows[0], salt, hash)
    });
}

User.login = (body, cb) => {
  async.waterfall([done => {
    User.get(body.email.toLowerCase(), done);
  }, (result, done) => {
    if (result.rows.length !== 0) {
      bcrypt.compare(body.password, result.rows[0].passwordHash, (err, isValid) => {
        cb(err, result, isValid);
      });
    } else {
      cb('Email does not exist');
    }
  }
  ], err => {
    cb(err);
  })
}

User.signup = (body, cb) => {
  const email = body.email.toLowerCase();
  async.waterfall([done => {
    User.get(email, done);
  }, (result, done) => {
    if (result.rows.length == 0) {
      bcrypt.genSalt(10, done);
    } else {
      done('Email already exists');
    }
  }, (salt, done) => {
    bcrypt.hash(body.password, salt, (err, hash) => {
      done(err, salt, hash)
    });
  }, (salt, hash, done) => {
    User.create(email, salt, hash, body, done);
  }, (user, done) => {
    new Notification({
      ownerEmail: body.email,
      subject: 'Thank you',
      text: "Thank you for signing up for VetGuard."
    }).push(err => {
      done(err, user);
    })
  }, (user, done) => {
    cb(null, user);
  }
  ], err => {
    cb(err);
  }
  );
}

User.update = (body, id, done) => {
  db.query('UPDATE public.users SET email=$1, "firstName"=$2, "lastName"=$3, "phoneNumber"=$4 WHERE "id" = $5',
    [body.email, body.firstName, body.lastName, body.phoneNumber, id], (err, ignored) => {
      done(err)
    });
}

User.getByResetPasswordToken = (resetPasswordToken, done) => {
  db.query('SELECT * FROM "users" WHERE "resetPasswordToken" = $1', [resetPasswordToken], done);
}

User.setResetPasswordToken = (email, resetPasswordToken, done) => {
  db.query('UPDATE public.users SET "resetPasswordToken"=$1, "resetPasswordTokenExpiration"=$2 WHERE email = $3', [resetPasswordToken, Date.now() + 3600000, email], (err, result) => {
    done(err, resetPasswordToken);
  });
}

User.resetPassword = (salt, hash, resetPasswordToken, done) => {
  db.query('UPDATE public.users SET salt=$1, "passwordHash"=$2, "resetPasswordToken"=NULL, "resetPasswordTokenExpiration"=NULL WHERE "resetPasswordToken" = $3',
    [salt, hash, resetPasswordToken], (err, ignored) => {
      done(err, salt, hash)
    });
}

User.setStripeCustomerId = (stripeCustomerId, email, done) => {
  db.query('UPDATE public.users SET "stripeCustomerId"=$1 WHERE "email"=$2', [stripeCustomerId, email], done);
}

export default User;
