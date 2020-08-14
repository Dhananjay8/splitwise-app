const express = require('express'),
  router = express.Router(),
  cookieParser = require('cookie-parser');

const rootPrefix = "..",
  coreConstants = require(rootPrefix + '/coreConstants'),
  AddExpense = require(rootPrefix + '/app/services/AddExpense'),
  RegisterUser = require(rootPrefix + '/app/services/Register');

// router.use(cookieParser(coreConstants.COOKIE_SECRET));

// Register user.
router.post('/register', async function(req, res) {

  const first_name = req.body.first_name,
    last_name = req.body.last_name,
    user_name = req.body.user_name;

  new RegisterUser({
    first_name: first_name,
    last_name: last_name,
    user_name: user_name
  }).perform().then(function(rsp){
    if(!rsp){
      res.status(500).json({});
    } else {
      if(rsp.success){
        res.status(200).json(rsp);
        res.send();
      } else {
        res.status(rsp.code).json(rsp);
        res.send();
      }
    }
  });
});

// Add an expense.
router.post('/expenses/add', async function(req, res) {

    const current_user_id = req.body.current_user_id,
      payer_user_name = req.body.payer_user_name,
      payee_user_name = req.body.payee_user_name,
      owe_amount = req.body.owe_amount;

    new AddExpense({
      current_user_id: current_user_id,
      payer_user_name: payer_user_name,
      payee_user_name: payee_user_name,
      owe_amount: owe_amount
    }).perform().then(function(rsp){
      if(!rsp){
        res.status(500).json({});
      } else {
        if(rsp.success){
          res.status(200).json(rsp);
          res.send();
        } else {
          res.status(rsp.code).json(rsp);
          res.send();
        }
      }
    });
});

module.exports = router;
