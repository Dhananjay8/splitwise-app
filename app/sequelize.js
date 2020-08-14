const Sequelize = require('sequelize');

/*

GRANT ALL PRIVILEGES ON *.* TO 'dhananjay'@'localhost' IDENTIFIED BY 'dhananjay';
exit

mysql -udhananjay -pdhananjay

CREATE DATABASE splitwise;
USE splitwise;

source set_env_vars.sh
node ./app/sequelize.js
 */


const rootPrefix = '..',
  UserModel = require(rootPrefix + '/app/models/User'),
  ExpenseModel = require(rootPrefix + '/app/models/Expense'),
  UserBalanceModel = require(rootPrefix + '/app/models/UserBalance'),
  coreConstants = require(rootPrefix + '/coreConstants');

const mysqlHost = coreConstants.MYSQL_HOST,
  mysqlUser = coreConstants.MYSQL_USER,
  password = coreConstants.MYSQL_PASSWORD,
  dbName = coreConstants.MYSQL_DB_NAME;

const sequelize = new Sequelize(dbName, mysqlUser, password, {
  host: mysqlHost,
  dialect: 'mysql',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const User = UserModel(sequelize, Sequelize),
  Expense = ExpenseModel(sequelize, Sequelize),
  UserBalance = UserBalanceModel(sequelize, Sequelize);

sequelize.sync({ force: true })
  .then(() => {
    console.log(`Database & tables created!`);
    process.exit(1);
  });

module.exports = {
  User,
  UserBalance,
  Expense
};
