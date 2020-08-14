const rootPrefix = '..';

class Validator {
  constructor() {}

  static validateName(name) {
    if (typeof name !== 'string') {
      return false;
    }

    return /^[a-zA-Z]+$/.test(name);
  }
}

module.exports = Validator;
