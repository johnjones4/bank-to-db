const database = require('../lib/database');
const importer = require('../lib/importer');

const argv = require('minimist')(process.argv.slice(2));

database.init()
  .then(() => {
    return importer.import(argv.type,argv.name,argv.file);
  })
  .then(() => {
    console.log('Imported!');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(-1);
  })
