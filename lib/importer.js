const fs = require('fs-extra');
const parse = require('csv-parse');
const _ = require('lodash');
const database = require('./database');
const crypto = require('crypto');

exports.import = (type,name,csvFile) => {
  return fs.readFile(csvFile)
    .then((data) => {
      return new Promise((resolve,reject) => {
        const columns = getColumns(type);
        parse(data,{columns},(err,output) => {
          if (err) {
            reject(err);
          } else {
            resolve(output)
          }
        });
      });
    })
    .then((objects) => {
      if (coverters[type]) {
        return coverters[type](name,objects);
      } else {
        return objects;
      }
    })
    .then((converted) => predictCategories(converted))
    .then((converted) => {
      const insertRow = (i) => {
        if (i < converted.length) {
          const row = converted[i];
          return database.find(row)
            .then((foundRows) => {
              if (foundRows.length == 0) {
                return database.insert(row);
              }
            })
            .then(() => {
              return insertRow(i+1);
            });
        }
      }
      return insertRow(0);
    });
}

const coverters = {
  'allybank': (name,objects) => {
    return objects.map((row) => ({
      'source': name || 'Ally Bank',
      'description': row[' Description'],
      'date': new Date(Date.parse(row.Date + ' ' + row[' Time'])),
      'amount': parseFloat(row[' Amount'])
    }));
  },
  'chasecard': (name,objects) => {
    return objects.map((row) => ({
      'source': name || 'Chase Credit Card',
      'description': row.Description,
      'date': new Date(Date.parse(row['Trans Date'])),
      'amount': parseFloat(row.Amount)
    }));
  },
  'amexcard': (name,objects) => {
    return objects.map((row) => ({
      'source': name || 'American Express Card',
      'description': row.description,
      'date': new Date(Date.parse(row.date.substring(0,10))),
      'amount': parseFloat(row.amount * -1)
    }));
  },
  'mandtbank': (name,objects) => {
    return objects.filter((row) => row.amount).map((row) => ({
      'source': name || 'M&T Bank',
      'description': row.description,
      'date': new Date(Date.parse(row.date)),
      'amount': parseFloat(row.amount)
    }));
  },
  'applefcu': (name,objects) => {
    return objects.filter((row) => row.amount).map((row) => ({
      'source': name || 'Apple FCU',
      'description': row.description,
      'date': new Date(Date.parse(row.date)),
      'amount': parseFloat(row.amount.replace('$',''))
    }));
  }
}

const predictCategories = (objects) => {
  const predictCategory = (i) => {
    if (i < objects.length) {
      return database.findCategory(objects[i].description)
        .then((categories) => {
          if (categories.length > 0) {
            objects[i].category = categories[0].category;
          }
          return predictCategory(i+1);
        });
    } else {
      return objects;
    }
  }
  return predictCategory(0);
}

const getColumns = (type) => {
  switch(type) {
    case 'amexcard':
      return ['date','b1','description','b2','b2','b3','b4','amount','b5','b6','b7','b8','b9','b10','b11','b12'];
    case 'mandtbank':
      return ['b1','date','description','amount','b2','b3'];
    case 'applefcu':
      return ['date','description','amount','b1'];
    default:
      return true;
  }
}
