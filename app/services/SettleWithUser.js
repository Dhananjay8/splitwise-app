const Sequelize = require('sequelize');

const rootPrefix = '../..',
  UserModel = require(rootPrefix + '/app/models/User'),
  ServicesBase = require(rootPrefix + '/app/services/Base'),
  UserBalancesModel = require(rootPrefix + '/app/models/UserBalance'),
  mysqlProvider = require(rootPrefix + '/lib/providers/mysql');

const mysqlInstance = mysqlProvider.getInstance();

class SettleWithUser extends ServicesBase {
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.currentUserId = +params.current_user_id;
    oThis.settleWithUserName = params.settle_with_user_name;

    oThis.otherUserId = null;
  }

  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    await oThis._settleUp();

    return {
      success: true,
      data: {
        id: oThis.currentUserId,
      }
    }
  }

  async _validateAndSanitize() {
    const oThis = this,
      User = UserModel(mysqlInstance, Sequelize);


    const userResponse = await User.findAll({
      where: {
        user_name: [oThis.settleWithUserName]
      }
    });

    if(userResponse.length) {
      oThis.otherUserId = userResponse[0].dataValues.id;
    }

    if(!oThis.otherUserId) {
      return Promise.reject({
        success: false,
        code: 422,
        internal_error_identifier: 'a_s_suwu_1',
        api_error_identifier: 'user_not_found',
        debug_options: {settle_with_user_name: oThis.settleWithUserName}
      })
    }
  }

  async _settleUp() {
    const oThis = this,
      UserBalances = UserBalancesModel(mysqlInstance, Sequelize);

    await UserBalances.update({
      amount: 0
      },
      { where:
          {
            payer_id: oThis.currentUserId,
            payee_id: oThis.otherUserId
          }
      });

    await UserBalances.update({
        amount: 0
      },
      { where:
          {
            payer_id: oThis.otherUserId,
            payee_id: oThis.currentUserId
          }
      });
  }
}

module.exports = SettleWithUser;
