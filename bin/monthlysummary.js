const database = require('../lib/database');

const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

database.init()
  .then(() => {
    const now = new Date();
    const monthlySpending = [];
    const queryMonth = (month) => {
      if (month <= now.getMonth()) {
        const startDate = new Date(now.getFullYear(),month,1,0,0,0,0);
        const endDate = new Date(now.getFullYear(),month+1,1,0,0,0,0);
        const range = [startDate,endDate];
        console.log(range)
        return database.knex('transactions').sum('amount').whereBetween('date',range).then((sum) => {
          monthlySpending.push({
            'month': months[month],
            'total': sum[0].sum
          });
          return queryMonth(month+1);
        });
      } else {
        return monthlySpending;
      }
    }
    return queryMonth(0)
  })
  .then((monthlySpending) => {
    console.log(monthlySpending);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(-1);
  })
