import Immutable from 'immutable';
import db from '../db.js';
import costCalculator from '../util/costCalculator.js';

const BookingRequest = Immutable.Record({
  userId: null,
  numberOfGuards: null,
  armed: null,
  uniformed: null,
  fromTimestamp: null,
  toTimestamp: null,
  fromAction: null,
  toAction: null,
  fromAddress: null,
  toAddress: null,
  notes: null
});

const columns = '"numberOfGuards", armed, uniformed, "fromAction", "toAction", "fromAddress", "toAddress", notes, "fromTimestamp", "toTimestamp", "bookingRequests".id, "fromLat", "fromLong", "userId"';

BookingRequest.get = (id, userId, done) => {
  db.query(`SELECT ${columns} FROM "bookingRequests" WHERE "userId"=$1 AND id =$2`, [userId, id], function(err, result) {
    result.rows = result.rows.map((row) => Object.assign(row, {
      cost: costCalculator(row)
    }));
    done(err, result);
  });
}

BookingRequest.getPastAndUpcomingRequests = (id, done) => {
  BookingRequest.getUserRequests(id, (err, result) => {
    const currentTime = new Date().getTime();
    result.rows = result.rows.map((row) => Object.assign(row, {
      cost: costCalculator(row)
    }));
    const sortedResults = result.rows.sort((a, b) => a.fromTimestamp > b.fromTimestamp);
    const upcomingRequests = sortedResults.filter(r => r.fromTimestamp > currentTime);
    const pastRequests = sortedResults.filter(r => r.fromTimestamp < currentTime);
    done(err, upcomingRequests, pastRequests);
  });
}

BookingRequest.getUserRequests = (userId, done) => {
  db.query(`SELECT ${columns} FROM "bookingRequests" WHERE "userId"=$1`, [userId], done);
}


BookingRequest.getAll = done => {
  db.query(`SELECT ${columns}, "email", array_agg("guardId") as "guardIds" FROM "bookingRequests" LEFT JOIN "guardAssignments" ON "bookingRequests".id = "guardAssignments"."bookingRequestId" JOIN users ON "bookingRequests"."userId" = users.id GROUP BY "bookingRequests".id, "guardAssignments"."bookingRequestId", users.email ORDER BY "bookingRequests".id`, [], done);
}

BookingRequest.getAllAssigned = (guardId, done) => {
  db.query(`SELECT ${columns} FROM "bookingRequests" JOIN "guardAssignments" ON "bookingRequests".id = "guardAssignments"."bookingRequestId" WHERE "guardId"=$1 AND "fromTimestamp" > $2;`, [guardId, new Date().getTime()], done);
}

BookingRequest.getUpcomingAssigned = (offset, done) => {
  db.query(`SELECT ${columns} FROM "bookingRequests" JOIN "guardAssignments" ON "bookingRequests".id = "guardAssignments"."bookingRequestId" WHERE "guardId" IS NOT NULL AND "fromTimestamp" > $1 AND "fromTimestamp" < $2;`, [new Date().getTime() - offset - 60 * 60 * 1000, new Date().getTime() - offset + 60 * 60 * 1000], done);
}


BookingRequest.getPastAssigned = (guardId, done) => {
  db.query(`SELECT ${columns} FROM "bookingRequests" JOIN "guardAssignments" ON "bookingRequests".id = "guardAssignments"."bookingRequestId" WHERE "guardId"= $1 AND "fromTimestamp" < $2;`, [guardId, new Date().getTime()], done);
}


BookingRequest.getAllUnassigned = done => {
  db.query(`SELECT ${columns} FROM "bookingRequests" LEFT JOIN "guardAssignments" ON "bookingRequests".id = "guardAssignments"."bookingRequestId" WHERE "guardId" IS NULL AND "fromTimestamp" > $1;`, [new Date().getTime()], done);
}

BookingRequest.getAllNearbyUnassigned = (guard, done) => {
  db.query(`SELECT ${columns} , point($1, $2) <@> point("bookingRequests"."fromLat", "bookingRequests"."fromLong")::point AS distance FROM "bookingRequests" LEFT JOIN "guardAssignments" ON "bookingRequests".id = "guardAssignments"."bookingRequestId" WHERE "guardId" IS NULL AND (point($1, $2) <@> point("bookingRequests"."fromLat", "bookingRequests"."fromLong") < $3) ORDER by distance;`, [guard.serviceLat, guard.serviceLong, guard.serviceRadius], done);
}

BookingRequest.create = (body, userId, done) => {
  //NOTE: ARRIVE, REMAINED are hard coded in. toAddress is the same as fromAddress
  var fromDate = body.fromDate;//new Date(`${body.fromDate} ${body.fromTime}`).getTime()
  console.log('FromDate = ' + fromDate);
  var toDate = body.toDate;//new Date(`${body.toDate} ${body.toTime}`).getTime()
  console.log('ToDate = ' + toDate);
  db.query('INSERT INTO public."bookingRequests"("userId", "numberOfGuards", armed, uniformed, "fromTimestamp", "toTimestamp", "fromAction", "toAction", "fromAddress", "fromLat", "fromLong", "toAddress", "notes")  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)  RETURNING id;',
    [userId, body.numberOfGuards, body.armed, body.uniformed, fromDate,
      toDate, 'ARRIVE', 'REMAIN', body.fromAddress, parseFloat(body.fromLat), parseFloat(body.fromLong), body.fromAddress, body.notes], done);
}

BookingRequest.update = (id, body, userId, done) => {
  const fromTimestamp = new Date(`${body.fromDate} ${body.fromTime}`).getTime();
  const toTimestamp = new Date(`${body.toDate} ${body.toTime}`).getTime();
  db.query('UPDATE public."bookingRequests" SET "numberOfGuards"=$1, armed=$2, uniformed=$3, "fromTimestamp"=$4, "toTimestamp"=$5, "fromAction"=$6, "toAction"=$7, "fromAddress"=$8, "fromLat"=$9, "fromLong"=$10, "toAddress"=$11, "notes"=$12 WHERE id=$13 AND "userId"=$14',
    [body.numberOfGuards, body.armed, body.uniformed, fromTimestamp, toTimestamp, body.fromAction, body.toAction, body.fromAddress, parseFloat(body.fromLat), parseFloat(body.fromLong), body.toAddress, body.notes, id, userId], done);
}

BookingRequest.delete = (id, userId, done) => {
  db.query('DELETE from public."bookingRequests" WHERE "userId"=$1 AND id=$2', [userId, id], done);
}

BookingRequest.setStripeChargeId = (id, stripeChargeId, done) => {
  db.query('UPDATE public."bookingRequests" SET "stripeChargeId"=$1 WHERE "id"=$2', [stripeChargeId, id], done);
}

BookingRequest.assignGuard = (id, guardId, done) => {
  db.query('INSERT INTO "guardAssignments" ("bookingRequestId", "guardId") VALUES ($1, $2)', [id, guardId], done);
}

BookingRequest.unassignGuard = (id, guardId, done) => {
  db.query('DELETE from public."bookingRequests" WHERE "bookingRequestId"=$1 AND "guardId"=$2', [id, guardId], done);
}



export default BookingRequest;
