const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser');

const rootPrefix = "..",
  Validators = require(rootPrefix + '/helpers/validators'),
  coreConstants = require(rootPrefix + '/coreConstants'),
  cookieHelper = require(rootPrefix + '/helpers/cookie'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user');

router.use(cookieParser(coreConstants.COOKIE_SECRET));

router.post('/test', async function(req, res) {

});

module.exports = router;
