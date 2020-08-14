const Sequelize = require('sequelize');

const rootPrefix = '../..',
  Validators = require(rootPrefix + '/lib/Validator'),
  UserModel = require(rootPrefix + '/app/models/User'),
  ServicesBase = require(rootPrefix + '/app/services/Base'),
  mysqlProvider = require(rootPrefix + '/lib/providers/mysql');

class RegisterUser extends ServicesBase{
  constructor(params) {
    super(params);
    const oThis = this;
    console.log('params =====', params);
    oThis.firstName = params.first_name;
    oThis.lastName = params.last_name;
    oThis.userName = params.user_name;
  }

  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    const userObj = await oThis._createUser();

    return {
      success: true,
      data: {
        user: {
          id: userObj.id,
          first_name: userObj.first_name,
          last_name: userObj.last_name,
          user_name: userObj.user_name
        }
      }
    }
  }

  async _validateAndSanitize() {
    const oThis = this;

    oThis.firstName = oThis.firstName.trim();
    oThis.lastName = oThis.lastName.trim();
    oThis.userName = oThis.userName.trim();

    if(oThis.firstName.length > 30 || !Validators.validateName(oThis.firstName)) {
      return Promise.reject({
        success: false,
        code: 422,
        internal_error_identifier: 'a_s_r_1',
        api_error_identifier: 'invalid_first_name',
        debug_options: {}
      })
    }

    if(oThis.lastName.length > 30 || !Validators.validateName(oThis.lastName)) {
      return Promise.reject({
        success: false,
        code: 422,
        internal_error_identifier: 'a_s_r_2',
        api_error_identifier: 'invalid_last_name',
        debug_options: {}
      })
    }

  }

  async _createUser() {
    const oThis = this,
      mysqlInstance = mysqlProvider.getInstance(),
      User = UserModel(mysqlInstance, Sequelize);

    const userCreationResponse = await User.create({
      first_name: oThis.firstName,
      last_name: oThis.lastName,
      user_name: oThis.userName,
    }).catch(function(err) {
      if(err.parent.code === 'ER_DUP_ENTRY') {
        return Promise.reject({
          success: false,
          code: 422,
          internal_error_identifier: 'a_s_r_6',
          api_error_identifier: `duplicate_entry_for_username:${oThis.userName}`,
          debug_options: {}
        })
      }
    });

    console.log('userCreationResponse------->', JSON.stringify(userCreationResponse));
    return userCreationResponse.dataValues;
  }
}

module.exports = RegisterUser;


