const Sequelize = require('sequelize');

const rootPrefix = '../..',
  UserModel = require(rootPrefix + '/app/models/User'),
  ServicesBase = require(rootPrefix + '/app/services/Base'),
  ExpensesModel = require(rootPrefix + '/app/models/Expense'),
  UserBalancesModel = require(rootPrefix + '/app/models/UserBalance'),
  mysqlProvider = require(rootPrefix + '/lib/providers/mysql');

const mysqlInstance = mysqlProvider.getInstance();

class AddExpense extends ServicesBase {
  constructor(params) {
    super(params);
    const oThis = this;

    oThis.payerUserName = params.payer_user_name;
    oThis.payeeUserName = params.payee_user_name;
    oThis.oweAmount = params.owe_amount;

    oThis.payerUserId = null;
    oThis.payeeUserId = null;
    oThis.expenseId = null;
  }

  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    await oThis._addExpense();

    return {
      success: true,
      data: {
        expense_id: oThis.expenseId
      }
    }
  }

  async _validateAndSanitize() {
    const oThis = this,
      User = UserModel(mysqlInstance, Sequelize);

    const userResponse = await User.findAll({
      where: {
        user_name: [oThis.payerUserName, oThis.payeeUserName]
      }
    });

    for(let i=0;i<userResponse.length;i++) {
      const userObj = userResponse[i].dataValues;

      if(userObj.user_name === oThis.payerUserName) {
        oThis.payerUserId = userObj.id;
      } else if(userObj.user_name === oThis.payeeUserName) {
        oThis.payeeUserId = userObj.id;
      }
    }

    if(!oThis.payerUserId || !oThis.payeeUserId) {
      return Promise.reject({
        success: false,
        code: 422,
        internal_error_identifier: 'a_s_ae_1',
        api_error_identifier: 'Invalid_payee_or_payer',
        debug_options: {payer_user_name: oThis.payerUserName,
        payee_user_name: oThis.payeeUserName}
      })
    }
  }

  async _addExpense() {
    const oThis = this,
      Expenses = ExpensesModel(mysqlInstance, Sequelize),
      UserBalances = UserBalancesModel(mysqlInstance, Sequelize);

    const expensesCreationResp = await Expenses.create({
      payer_id: oThis.payerUserId,
      payee_id: oThis.payeeUserId,
      amount: oThis.oweAmount
    });

    oThis.expenseId = expensesCreationResp.dataValues.id;

    const updateResp = await mysqlInstance.query(`UPDATE user_balances SET amount = amount + ? WHERE (payer_id = ? and payee_id = ?)`,
      {replacements:[oThis.oweAmount, oThis.payerUserId, oThis.payeeUserId]});

    if(updateResp[0].affectedRows > 0) {
    } else {
      await UserBalances.create({
        payer_id: oThis.payerUserId,
        payee_id: oThis.payeeUserId,
        amount: oThis.oweAmount
      }).catch(function(err) {
        if(err.parent.code === 'ER_DUP_ENTRY') {
          return Promise.reject({
            success: false,
            code: 500,
            internal_error_identifier: 'a_s_ae_3',
            api_error_identifier: 'something_went_wrong',
            debug_options: {}
          })
        }
      });
    }
  }
}

module.exports = AddExpense;
