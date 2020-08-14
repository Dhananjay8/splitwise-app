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

    console.log('params=======', params);

    oThis.payerUserName = params.payer_user_name;
    oThis.payeeUserNames = params.payee_user_names;
    oThis.oweAmount = params.owe_amount;

    oThis.payerUserId = null;
    oThis.payeeUserIds = [];
    oThis.expenseIds = [];
  }

  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    await oThis._addExpense();

    return {
      success: true,
      data: {
        expense_ids: oThis.expenseIds
      }
    }
  }

  async _validateAndSanitize() {
    const oThis = this,
      User = UserModel(mysqlInstance, Sequelize);

    console.log(oThis.payeeUserNames, typeof oThis.payeeUserNames);

    // oThis.payeeUserNames = JSON.parse((oThis.payeeUserNames));

    const userNameToQuery = oThis.payeeUserNames.concat(oThis.payerUserName);

    console.log('userNameToQuery===========', userNameToQuery);

    const userResponse = await User.findAll({
      where: {
        user_name: userNameToQuery
      }
    });

    for(let i=0;i<userResponse.length;i++) {
      const userObj = userResponse[i].dataValues;

      if(userObj.user_name === oThis.payerUserName) {
        oThis.payerUserId = userObj.id;
      } else if(oThis.payeeUserNames.includes(userObj.user_name)) {
        oThis.payeeUserIds.push(userObj.id);
      }
    }

    console.log('oThis.payeeUserId===========',oThis.payeeUserIds);

    if(!oThis.payerUserId || oThis.payeeUserIds.length === 0) {
      return Promise.reject({
        success: false,
        code: 422,
        internal_error_identifier: 'a_s_ae_1',
        api_error_identifier: 'Invalid_payee_or_payer',
        debug_options: {payer_user_name: oThis.payerUserName,
        payee_user_names: oThis.payeeUserNames}
      })
    }
  }

  async _addExpense() {
    const oThis = this,
      Expenses = ExpensesModel(mysqlInstance, Sequelize),
      UserBalances = UserBalancesModel(mysqlInstance, Sequelize);

    const equalShare = Math.round(oThis.oweAmount/oThis.payeeUserIds.length);

    console.log('equalShare=========', equalShare);

    for(let i = 0; i < oThis.payeeUserIds.length; i++) {
      let payeeUserId = oThis.payeeUserIds[i];

      const expensesCreationResp = await Expenses.create({
        payer_id: oThis.payerUserId,
        payee_id: payeeUserId,
        amount: oThis.oweAmount
      });

      oThis.expenseIds.push(expensesCreationResp.dataValues.id);

      const updateResp = await mysqlInstance.query(`UPDATE user_balances SET amount = amount + ? WHERE (payer_id = ? and payee_id = ?)`,
        {replacements:[equalShare, oThis.payerUserId, payeeUserId]});

      if(updateResp[0].affectedRows > 0) {
      } else {
        await UserBalances.create({
          payer_id: oThis.payerUserId,
          payee_id: payeeUserId,
          amount: equalShare
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
}

module.exports = AddExpense;
