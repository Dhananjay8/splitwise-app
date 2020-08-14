const Sequelize = require('sequelize');

const rootPrefix = '../..',
  Validators = require(rootPrefix + '/lib/Validator'),
  UserModel = require(rootPrefix + '/app/models/User'),
  ServicesBase = require(rootPrefix + '/app/services/Base'),
  UserBalancesModel = require(rootPrefix + '/app/models/UserBalance'),
  mysqlProvider = require(rootPrefix + '/lib/providers/mysql');

const mysqlInstance = mysqlProvider.getInstance();

class GetExpenseWithUser extends ServicesBase {
  constructor(params) {
    super(params);
    const oThis = this;
    console.log('params=======', params);
    oThis.currentUserId = +params.current_user_id;
    oThis.balanceCalculatedWith = params.balance_to_be_calculated_with;

    oThis.balanceCalculatedWithUserId = null;
  }

  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    const balance = await oThis._getExpense();

    let Description = null;

    console.log('balance=========', balance);

    if(balance == 0) Description = 'ALL SETTLED UP!';
    else if(balance < 0) Description = `You owe ${oThis.balanceCalculatedWith} Rs. ${Math.abs(balance)}.`;
    else Description = `You get back Rs.${Math.abs(balance)} from ${oThis.balanceCalculatedWith}.`;

    return {
      success: true,
      data: {balance: balance, info: Description}
    }
  }

  async _validateAndSanitize() {
    const oThis = this,
      User = UserModel(mysqlInstance, Sequelize);


    const userResponse = await User.findAll({
      where: {
        user_name: [oThis.balanceCalculatedWith]
      }
    });

    if(userResponse.length) {
      oThis.balanceCalculatedWithUserId = userResponse[0].dataValues.id;
    }

    if(!oThis.balanceCalculatedWithUserId) {
      return Promise.reject({
        success: false,
        code: 422,
        internal_error_identifier: 'a_s_gewu_1',
        api_error_identifier: 'user_not_found',
        debug_options: {balance_to_be_calculated_with: oThis.balanceCalculatedWith}
      })
    }
  }

  async _getExpense() {
    const oThis = this,
      UserBalances = UserBalancesModel(mysqlInstance, Sequelize);

    const currentUserPayerResp = await UserBalances.findAll({
      where: {
        payer_id: oThis.currentUserId,
        payee_id: oThis.balanceCalculatedWithUserId
      }
    });

    let currentUserPayerRespDataValues = null,
      balanceCalculatedWithUserPayerRespDataValues = null;

    if(currentUserPayerResp.length) {
      currentUserPayerRespDataValues = currentUserPayerResp[0].dataValues;
    }

    console.log('currentUserPayerRespDataValues =====', currentUserPayerRespDataValues);

    const otherUserPayerResp = await UserBalances.findAll({
      where: {
        payer_id: oThis.balanceCalculatedWithUserId,
        payee_id: oThis.currentUserId
      }
    });

    if(otherUserPayerResp.length) {
      balanceCalculatedWithUserPayerRespDataValues = otherUserPayerResp[0].dataValues;
    }

    console.log('otherUserPayerRespDataValues =====', balanceCalculatedWithUserPayerRespDataValues);

    if(currentUserPayerRespDataValues === null && balanceCalculatedWithUserPayerRespDataValues === null) {
      return 0;
    } else if(currentUserPayerRespDataValues === null) {
      return -balanceCalculatedWithUserPayerRespDataValues.amount;
    } else if(balanceCalculatedWithUserPayerRespDataValues === null) {
      return currentUserPayerRespDataValues.amount;
    } else {
      return (currentUserPayerRespDataValues.amount - balanceCalculatedWithUserPayerRespDataValues.amount);
    }
  }
}

module.exports = GetExpenseWithUser;
