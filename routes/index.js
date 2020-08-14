const express = require('express'),
  router = express.Router();

const rootPrefix = "..",
  AddExpense = require(rootPrefix + '/app/services/AddExpense'),
  SettleWithUser = require(rootPrefix + '/app/services/SettleWithUser'),
  GetExpenseWithUser = require(rootPrefix + '/app/services/GetExpenseWithUser'),
  ListAllExpenses = require(rootPrefix + '/app/services/ListAllExpenses'),
  RegisterUser = require(rootPrefix + '/app/services/Register');

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

// Add expense.
router.post('/expenses/add', async function(req, res) {

    const payer_user_name = req.body.payer_user_name,
      payee_user_name = req.body.payee_user_name,
      owe_amount = req.body.owe_amount;

    new AddExpense({
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

// Settle up.
router.post('/balances/settle', async function(req, res) {

  const current_user_id = req.body.current_user_id,
    settle_with_user_name = req.body.settle_with_user_name;

  new SettleWithUser({
    current_user_id: current_user_id,
    settle_with_user_name: settle_with_user_name
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

// Get balance calculation with another user.
router.get('/balances/get', async function(req, res) {

  const current_user_id = req.query.current_user_id,
    balance_calculated_with_user_name = req.query.balance_calculated_with_user_name;

  new GetExpenseWithUser({
    current_user_id: current_user_id,
    balance_to_be_calculated_with: balance_calculated_with_user_name
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

// Get current users all expenses.
router.get('/expenses/list', async function(req, res) {

  const current_user_id = req.query.current_user_id;

  new ListAllExpenses({
    current_user_id: current_user_id
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
