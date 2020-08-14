const Sequelize = require('sequelize');

const rootPrefix = '../..',
  UserModel = require(rootPrefix + '/app/models/User'),
  ServicesBase = require(rootPrefix + '/app/services/Base'),
  ExpensesModel = require(rootPrefix + '/app/models/Expense'),
  mysqlProvider = require(rootPrefix + '/lib/providers/mysql');

const mysqlInstance = mysqlProvider.getInstance();

class ListAllExpenses extends ServicesBase {
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.currentUserId = params.current_user_id;

    oThis.expenses = [];
    oThis.userIds = [];
    oThis.userIdToUserNameMap = {};
  }

  async _asyncPerform() {
    const oThis = this;

    await oThis._listAll();

    return {
      success: true,
      data: {
        expenses: oThis.expenses
      }
    }
  }

  async _listAll() {
    const oThis = this,
      Expenses = ExpensesModel(mysqlInstance, Sequelize),
      User = UserModel(mysqlInstance, Sequelize);

    const expensesResp = await Expenses.findAll({
      where: Sequelize.or({
          payer_id: oThis.currentUserId
        },
        { payee_id: oThis.currentUserId
        })
    });

    for(let index = 0; index < expensesResp.length; index++) {
      const expense = expensesResp[index].dataValues;
      oThis.userIds.push(expense.payer_id);
      oThis.userIds.push(expense.payee_id);
    }

    console.log('oThis.userIds =====', oThis.userIds);
    oThis.userIds = [...new Set(oThis.userIds)];
    console.log('oThis.userIds =====', oThis.userIds);

    const userResponse = await User.findAll({
      where: {
        id: oThis.userIds
      }
    });

    for(let index = 0; index < userResponse.length; index++) {
      const user = userResponse[index].dataValues;
      oThis.userIdToUserNameMap[user.id] = user.user_name;
    }
    console.log('oThis.userIdToUserNameMap=====', oThis.userIdToUserNameMap);

    for(let index = 0; index<expensesResp.length; index++) {
      const expense = expensesResp[index].dataValues;

      oThis.expenses.push({
        id: expense.id,
        payer_name: oThis.userIdToUserNameMap[expense.payer_id],
        payee_name: oThis.userIdToUserNameMap[expense.payee_id],
        amount: expense.amount
      })
    }

    console.log('oThis.expenses========', oThis.expenses);

  }
}

module.exports = ListAllExpenses;

