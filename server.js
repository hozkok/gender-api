const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const mongoose = require('mongoose');
mongoose.Promise = Promise;

const server = new Koa();
const router = new Router();

const db = require('./db');

async function saveObj(obj) {
  const mongoObj = new db(obj);
  return mongoObj.save()
    .then((savedObj) => {
      console.log(obj.name + ' is saved.');
      return Promise.resolve(savedObj);
    })
    .catch(err => {
      if (err.code === 11000) {
        const msg = 'DUPLICATE NAME: ' + obj.name;
        console.log(msg);
        return Promise.reject({
          message: msg
        });
      }
      return Promise.reject(err);
    });
}


const pick = (keys) => (obj) => keys.reduce((acc, key) => {
  acc[key] = obj[key];
  return acc;
}, {});
const reduceFields = pick(['name', 'gender']);

router.get('/get/:name', async (ctx, next) => {
  const name = ctx.params.name.toUpperCase();
  const queryResult = await db.findOne({name: name});
  ctx.body = queryResult
    ? reduceFields(queryResult)
    : {name, gender: 'Unknown'};
});

router.get('/match/:qry', async (ctx, next) => {
  const qry = ctx.params.qry;
  const queryResult = await db.find({
    name: new RegExp(qry, 'i')
  });
  ctx.body = queryResult.map(reduceFields);
});

router.post('/add', async (ctx, next) => {
  const {name, gender} = ctx.request.query;
  console.log(ctx.request.query);
  try {
    const savedObj = await saveObj({name, gender});
    ctx.body = savedObj;
  } catch (err) {
    ctx.body = err;
    ctx.status = 400;
  }
});

server.use(bodyParser());
server.use(router.routes());

const PORT = 8080;

async function run() {
  await mongoose.connect('mongodb://localhost/genders');
  const bla = await server.listen(PORT);
  console.log('listening at port %s', PORT);
}

run();
