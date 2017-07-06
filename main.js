const nameModel = require('./db');
const fs = require('fs');
const mongoose = require('mongoose');

mongoose.Promise = Promise;

function getNames(path) {
  const data = fs.readFileSync(path).toString().split('\n');
  data.pop();
  return data.map(line => {
    const [name, gender] = line.split(',');
    return {name, gender};
  });
}

function fileToObjects(file) {
  const objects = file.split('\n')
    .filter(l => l !== '')
    .map(l => l.split(','))
    .map(([name, gender, ...rest]) => ({name, gender}));
  return objects;
}

async function saveObj(obj) {
  const mongoObj = new nameModel(obj);
  return mongoObj.save()
    .then(() => {
      console.log(obj.name + ' is saved.');
    })
    .catch(err => {
      if (err.code === 11000) {
        console.log('DUPLICATE NAME: ', obj.name);
        return Promise.resolve();
      }
      return Promise.reject(err);
    });
}

async function chain(fns) {
  const fn = fns.pop();
  if (!fn) {
    return Promise.resolve();
  }
  await fn();
  return chain(fns);
}

async function getNamesFromYobs() {
  const dir = 'data';
  const files = fs.readdirSync(dir);
  const f = fs.readFileSync(dir + '/' + files[0]).toString();
  const objects = fileToObjects(f);
  return chain(files.map((fileName) => {
    const file = fs.readFileSync(dir + '/' + files[0]).toString();
    const objects = fileToObjects(f);
    return () => chain(objects.map((o) => () => saveObj(o)));
  }));
}

async function main() {
  await mongoose.connect('mongodb://localhost/genders');
  const names = getNames('data/names.csv');
  try {
    await Promise.all(names.map(({name, gender}) => {
      const mongoObj = new nameModel({name, gender});
      console.log({name, gender});
      return mongoObj.save()
        .catch(err => {
          if (err.code === 11000) {
            console.log('DUPLICATE NAME: ', name, gender);
            return Promise.resolve();
          } else {
            return Promise.reject(err);
          }
        });
    }));
  } catch (err) {
    console.error('ERR:', err);
  }
}

async function ready() {
  await mongoose.connect('mongodb://localhost/genders');
}

function processedToObjects(file) {
  const objects = file.split('\n')
    .filter(l => l !== '')
    .map(l => l.split(','))
    .map(l => ({name: l[1].substr(1, l[1].length-2), gender: (l[5] === '"Male"' ? 'M' : 'F')}))
  objects.shift();
  //.map(([name, gender, ...rest]) => ({name, gender}));
  return objects;
}

async function getNamesFromProcessed() {
  const file = fs.readFileSync('/media/sf_vbox-shared/genders/Names_Processed.csv').toString();
  const objects = processedToObjects(file);
  return objects;
}

ready().then(async () => {
  const objects = await getNamesFromProcessed();
  await chain(objects.map((o) => () => saveObj(o)));
  console.log('done.');
});


//main();
