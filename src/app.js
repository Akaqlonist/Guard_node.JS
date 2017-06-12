import express from 'express';
import path from 'path';
import favicon from 'serve-favicon';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'client-sessions';

const app = module.exports = express();

import index from './routes/index';
import auth from './routes/auth';
import bookings from './routes/bookings';
import notifications from './routes/notifications';
import users from './routes/users';
import shifts from './routes/shifts';
import admin from './routes/admin';
import apiAuth from './routes/v1/auth';
import apiBookings from './routes/v1/bookings';
import apiShifts from './routes/v1/shifts';
import apiPayments from './routes/v1/payments';
import pg from 'pg';
import flash from 'express-flash';
import cors from 'cors';

pg.defaults.ssl = true;
pg.connect(process.env.DATABASE_URL, (err, client) => {
  if (err) {
    throw err
  }
  ;
  console.log('Connected to postgres! Getting schemas...');

  client
  .query('SELECT table_schema,table_name FROM information_schema.tables;')
  .on('row', row => {
    console.log(JSON.stringify(row));
  });
});

app.locals.moment = require('moment');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors());

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));
const secret = 'asdklfjasdlkzxcnw34ioasensdnklawe';
app.set('secret', secret);
app.use(session({
  cookieName: 'session',
  secret,
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}))

app.use((req, res, next) => {
  res.locals = {
    user: req.session.user
  }
  next();
});

app.use('/', index);
app.use('/auth', auth);
app.use('/bookings', bookings);
app.use('/notifications', notifications);
app.use('/users', users);
app.use('/shifts', shifts);
app.use('/admin', admin);
app.use('/v1/auth', apiAuth);
app.use('/v1/bookings', apiBookings);
app.use('/v1/shifts', apiShifts);
app.use('/v1/payments', apiPayments);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});



// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

export default app
