import pg from 'pg';

pg.defaults.ssl = true;

export default {
   query(text, values, cb) {
      pg.connect(process.env.DATABASE_URL, (err, client, done) => {
        client.query(text, values, (err, result) => {
          done();
          cb(err, result);
        })
      });
   }
};