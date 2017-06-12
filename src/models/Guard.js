import Immutable from 'immutable';
import db from '../db.js';
import UserTypes from '../constants/UserTypes.js';


const Guard = Immutable.Record({
  email:null,
  userId:null,
  dateOfBirth:null,
  serviceAddress:null,
  serviceRadius:null,
  serviceLat:null,
  serviceLong:null
});

Guard.get = (id, done) => {
  db.query('SELECT guards.*, users."firstName", users."lastName", users."email", users."phoneNumber", users."type" FROM "guards" JOIN users ON guards."userId" = users.id WHERE guards."id"=$1', [id], done);
}

Guard.getByUserId = (userId, done) => {
  db.query('SELECT * FROM "guards" WHERE "userId"=$1', [userId], done);
}

Guard.getAll = done => {
  db.query('SELECT guards.*, users."firstName", users."lastName", users."email", users."phoneNumber", users."type" FROM "guards" JOIN users ON guards."userId" = users.id', [], done);
}

Guard.findNearbyGuards = (bookingLat, bookingLong, done) => {
  db.query('SELECT guards.*, users.email, point($1, $2) <@> point("guards"."serviceLat", "guards"."serviceLong")::point AS distance FROM "guards"  JOIN users ON guards."userId" = users.id WHERE (point($1, $2) <@> point(guards."serviceLat", guards."serviceLong") < guards."serviceRadius") ORDER by distance;', [bookingLat, bookingLong], done);
}

Guard.create = (body, userId, done) => {
  db.query('INSERT INTO public.guards("userId", "dateOfBirth", "serviceAddress", "serviceRadius", "serviceLat", "serviceLong") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;', [userId, body.dateOfBirth, body.serviceAddress, body.serviceRadius, body.serviceLat, body.serviceLong], done);
}

Guard.update = (body, id, done) => {
  db.query('UPDATE public.guards SET "dateOfBirth"=$1, "serviceAddress"=$2, "serviceRadius"=$3, "serviceLat"=$4, "serviceLong"=$5 WHERE id=$6;', [body.dateOfBirth, body.serviceAddress, body.serviceRadius, body.serviceLat, body.serviceLong, id], done);
}

export default Guard;