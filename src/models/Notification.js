import Immutable from 'immutable';
const api_key = 'key-699a721a2c81765a061cda8a7736d5e6';
const domain = 'vetguards.com';
const mailgun = require('mailgun-js')({apiKey: api_key, domain});
import db from '../db.js';

const Notification = Immutable.Record({
  id:null,
  ownerEmail:null, 
  timestamp:null, 
  subject:null,
  text:null
});

Notification.prototype.push = function(done) {
  const data = {
    from: 'VetGuards <do-not-reply@vetguards.com>',
    to: this.ownerEmail,
    subject: this.subject,
    html: this.text
  };
  mailgun.messages().send(data, (err, body) => {
    console.log(body);
    db.query('INSERT INTO public."notifications"("ownerEmail", "timestamp", subject, text)  VALUES ($1, $2, $3, $4);', 
      [data.to, new Date().getTime(), data.subject, data.html], (err, result) => {
        done(err);
      });
  });
}


export default Notification;