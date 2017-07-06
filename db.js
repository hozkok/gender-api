const mongoose = require('mongoose');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');

const nameSchema = new mongoose.Schema({
  name: {type: String, unique: true, required: true, uppercase: true},
  gender: {type: String, enum: ['M', 'F'], required: true}
});

module.exports = mongoose.model('Name', nameSchema);
