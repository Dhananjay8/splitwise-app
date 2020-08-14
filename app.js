const express = require('express'),
  path = require('path'),
  customUrlParser = require('url'),
  bodyParser = require('body-parser');

const rootPrefix = '.',
  apiRoutes = require(rootPrefix + '/routes/index');

const port = process.env.PORT || 3000;

/**
 * Assign params
 *
 * @param req
 * @param res
 * @param next
 */
const assignParams = function(req, res, next) {
  req.decodedParams = Object.assign(getRequestParams(req), req.decodedParams);

  const message = [
    "\n\n\nStarted '",
    customUrlParser.parse(req.originalUrl).pathname,
    "'  '",
    req.method,
    "' at ",
    new Date()
  ];

  console.log(message.join(''));

  next();
};

/**
 * Get request params
 *
 * @param req
 * @return {*}
 */
const getRequestParams = function(req) {

  if (req.method === 'POST') {
    return req.body;
  } else if (req.method === 'GET') {
    return req.query;
  }

  return {};
};


const setResponseHeader = async function(req, res, next) {
  next();
};

// If the process is not a master

// Set worker process title
process.title = 'Splitwise api node worker';

// Create express application instance
const app = express();

// Node.js body parsing middleware.
app.use(bodyParser.json());

// Parsing the URL-encoded data with the qs library (extended: true)
app.use(bodyParser.urlencoded({ extended: true }));

// Static file location
app.use(express.static(path.join(__dirname, 'public')));

// set response Headers
app.use(setResponseHeader);

/**
 * NOTE: API routes where first sanitize and then assign params
 */
app.use('/api', assignParams, apiRoutes);

// Catch 404
app.use(function(req, res, next) {
  const payload = {
    url: req.originalUrl,
    error: 'Not found'
  };
  return res.status(404).json(payload);
});

module.exports = app;
