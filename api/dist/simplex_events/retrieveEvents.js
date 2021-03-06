'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mangodb = require('../mangodb');

var _eachOfSeries = require('async/eachOfSeries');

var _eachOfSeries2 = _interopRequireDefault(_eachOfSeries);

var _logging = require('logging');

var _logging2 = _interopRequireDefault(_logging);

var _config = require('../config');

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logger = (0, _logging2.default)('simplex_events/retrieveEvents.js');

(0, _mangodb.connect)().then(function () {
  logger.info('mangodb running on port: ' + _config.mangodb.host + ':' + _config.mangodb.port);
}).catch(function (err) {
  logger.error('mangodb error: ' + err);
});

var getEvents = function getEvents() {
  return new Promise(function (resolve, reject) {
    var options = {
      url: _config.simplex.eventEP,
      headers: {
        'Authorization': 'ApiKey ' + _config.simplex.apiKey
      },
      method: 'get',
      json: true
    };
    var callback = function callback(error, response, body) {
      if (!error && response.statusCode === 200) {
        (0, _eachOfSeries2.default)(body.events, processEvent, function (error) {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      } else if (response.statusCode === 400) {
        reject(body);
      } else {
        reject(error);
      }
    };
    (0, _request2.default)(options, callback);
  });
};

var processEvent = function processEvent(item, key, callback) {
  (0, _mangodb.findAndUpdate)(item.payment.partner_end_user_id, {
    status: item.payment.status
  }).catch(function (err) {
    logger.error(err);
  });
  var options = {
    url: _config.simplex.eventEP + '/' + item.event_id,
    headers: {
      'Authorization': 'ApiKey ' + _config.simplex.apiKey
    },
    method: 'DELETE',
    json: true
  };
  (0, _request2.default)(options, callback);
};

exports.default = getEvents;