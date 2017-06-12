import pg from 'pg';

pg.defaults.ssl = true;

import User from '../models/User';
const stripe = require("stripe")(process.env.STRIPE_API_KEY);

User.getAll((err, result) => {
  result.rows.forEach((user) => {
    if (!user.stripeCustomerId) { 
      console.log(`creating stripe customer id for ${user.email}`)
      stripe.customers.create({
        email: user.email
      }).then(customer => {
        User.setStripeCustomerId(customer.id, user.email, (err, unused) => {
          if (err) {
            console.log(err);
          }
        });
      })
    }
  })
})
