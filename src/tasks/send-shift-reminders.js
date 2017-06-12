import pg from 'pg';

pg.defaults.ssl = true;

import BookingRequests from '../models/BookingRequest';
import Guard from '../models/Guard';
import Notification from '../models/Notification';

const oneDay = 24*60*60*1000;

import async from 'async';
import jade from 'jade';

const processedRequests = [];

for (let days = 1; days <= 3; days += 2) {
  console.log(`processing ${days}-day emails...`);
  async.waterfall([
    done => {
      console.log("retrieving upcoming assigned booking requests...");
      BookingRequests.getUpcomingAssigned(oneDay*days, done);
    },
    function(results, done) {
      var cbs = []
      var emails = []
      console.log(`found ${results.rows.length} requests. Processing...`);
      for (const i in results.rows) {
        cbs.push(Guard.get.bind(this, results.rows[i].assignedGuardId));
        emails.push(jade.renderFile('views/shift-reminder-email.jade', {
          moment: require('moment'),
          baseUrl: 'http://vetguards.com',
          request: results.rows[i],
        }));
        processedRequests.push(results.rows[i].id);
      }
      
      async.series(cbs, (err, resultArray) => {
        done(err, resultArray, emails);
      });
    },
    (resultArray, emails, done) => {
      var cbs = []
      if (emails.length == 0) {
        done(); return;
      }
      for (const i in resultArray) {
        const email = resultArray[i].rows[0].email;
        const notification = new Notification({
          ownerEmail: email,
          subject: `Reminder: Guard Shift in ${days}${days > 1 ? ' Days' : ' Day'}`,
          text: emails[i]
        });
        cbs.push(notification.push.bind(notification));
      }
      async.series(cbs, done);
    }
    ], err => {
      if (err) {
       console.log(err);
      }
    });
}
