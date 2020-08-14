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
    oThis.otherUserName = params.balance_to_be_calculated_with;

    oThis.otherUserId = null;
  }

  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    const balance = await oThis._getExpense();

    return {
      success: true,
      data: {balance: balance}
    }
  }

  async _validateAndSanitize() {
    const oThis = this,
      User = UserModel(mysqlInstance, Sequelize);


    const userResponse = await User.findAll({
      where: {
        user_name: [oThis.otherUserName]
      }
    });

    if(userResponse.length) {
      oThis.otherUserId = userResponse[0].dataValues.id;
    }

    if(!oThis.otherUserId) {
      return Promise.reject({
        success: false,
        code: 422,
        internal_error_identifier: 'a_s_gewu_1',
        api_error_identifier: 'user_not_found',
        debug_options: {balance_to_be_calculated_with: oThis.otherUserName}
      })
    }
  }

  async _getExpense() {
    const oThis = this,
      UserBalances = UserBalancesModel(mysqlInstance, Sequelize);

    const currentUserPayerResp = await UserBalances.findAll({
      where: {
        payer_id: oThis.currentUserId,
        payee_id: oThis.otherUserId
      }
    });

    let currentUserPayerRespDataValues = null,
      otherUserPayerRespDataValues = null;

    if(currentUserPayerResp.length) {
      currentUserPayerRespDataValues = currentUserPayerResp[0].dataValues;
    }

    console.log('currentUserPayerRespDataValues =====', currentUserPayerRespDataValues);

    const otherUserPayerResp = await UserBalances.findAll({
      where: {
        payer_id: oThis.otherUserId,
        payee_id: oThis.currentUserId
      }
    });

    if(otherUserPayerResp.length) {
      otherUserPayerRespDataValues = otherUserPayerResp[0].dataValues;
    }

    console.log('otherUserPayerRespDataValues =====', otherUserPayerRespDataValues);

    if(currentUserPayerRespDataValues === null && otherUserPayerRespDataValues === null) {
      return 0;
    } else if(currentUserPayerRespDataValues === null) {
      return -otherUserPayerRespDataValues.amount;
    } else if(otherUserPayerRespDataValues === null) {
      return currentUserPayerRespDataValues.amount;
    } else {
      return (currentUserPayerRespDataValues.amount - otherUserPayerRespDataValues.amount);
    }
  }
}

module.exports = GetExpenseWithUser;
