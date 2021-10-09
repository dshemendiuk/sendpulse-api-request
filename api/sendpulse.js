/*
 * Sendpulse REST API Node.js class
 *
 * Documentation
 * https://login.sendpulse.com/manual/rest-api/
 * https://sendpulse.com/api
 *
 */


'use strict';

var https = require('https');
var crypto = require('crypto');
var fs = require('fs');

var API_URL = 'api.sendpulse.com';
var API_USER_ID = '';
var API_SECRET = '';
var TOKEN_STORAGE = '';
var TOKEN = '';

var ERRORS = {
    INVALID_TOKEN: 'Invalid token',
    INVALID_RESPONSE: 'Bad response from server',
    INVALID_CREDENTIALS: 'Invalid credentials',
};

/**
 * MD5
 *
 * @param data
 * @return string
 */
function md5(data) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(data);
    return md5sum.digest('hex');
}

/**
 * Base64
 *
 * @param data
 * @return string
 */
function base64(data) {
    var b = new Buffer(data);
    return b.toString('base64');
}

/**
 * Create directory
 *
 * @param directory
 */
function mkdirSyncRecursive(directory) {
    var path = directory.replace(/\/$/, '').split('/');
    for (var i = 1; i <= path.length; i++) {
        var segment = path.slice(0, i).join('/');
        segment.length > 0 && !fs.existsSync(segment) ? fs.mkdirSync(segment) : null;
    }
};

/**
 * Sendpulse API initialization
 *
 * @param user_id
 * @param secret
 * @param storage
 * @param callback
 */
function init(user_id, secret, storage, callback) {
    API_USER_ID = user_id;
    API_SECRET = secret;
    TOKEN_STORAGE = storage;

    if (!callback) {
        callback = function () {
        }
    }

    if (!fs.existsSync(TOKEN_STORAGE)) {
        mkdirSyncRecursive(TOKEN_STORAGE);
    }

    if (TOKEN_STORAGE.substr(-1) !== '/') {
        TOKEN_STORAGE += '/';
    }

    var hashName = md5(API_USER_ID + '::' + API_SECRET);
    if (fs.existsSync(TOKEN_STORAGE + hashName)) {
        TOKEN = fs.readFileSync(TOKEN_STORAGE + hashName, {encoding: 'utf8'});
    }

    if (!TOKEN.length) {
        getToken(callback);
        return;
    }

    callback(TOKEN)
}

/**
 * Form and send request to API service
 *
 * @param path
 * @param method
 * @param data
 * @param callback
 *        Define the function  that will be called
 *        when a response is received.
 */
function sendRequest(path, method, data, callback) {
    var headers = {};
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));

    if (path !== 'oauth/access_token' && TOKEN.length) {
        headers['Authorization'] = 'Bearer ' + TOKEN;
    }
    if (method === undefined) {
        method = 'POST';
    }

    var options = {
        //uri: API_URL,
        path: '/' + path,
        port: 443,
        hostname: API_URL,
        method: method,
        headers: headers,
    };

    var req = https.request(
        options,
        function (response) {
            var answer = null;
            var str = '';
            response.on('data', function (chunk) {
                str += chunk;
            });

            response.on('end', function () {
                try {
                    answer = JSON.parse(str);
                } catch (ex) {
                    answer = returnError(ERRORS.INVALID_RESPONSE);
                }

                if (response.statusCode === 401) {
                    if (answer.error === 'invalid_client') {
                        callback(returnError(ERRORS.INVALID_CREDENTIALS));
                        return;
                    }

                    getToken(function (result) {
                        if (result && result.is_error === 1) {
                            callback(result);
                            return;
                        }

                        sendRequest(path, method, data, callback);
                    });
                    return;
                }

                callback(answer);
            });
        }
    );
    req.write(JSON.stringify(data));
    req.on('error', function (error) {
        var answer = returnError(error.code);
        callback(answer);
    });
    req.end();
}

/**
 * Get token and store it
 *
 * @param callback
 */
function getToken(callback) {
    if (!callback) {
        callback = function () {
        }
    }
    var data = {
        grant_type: 'client_credentials',
        client_id: API_USER_ID,
        client_secret: API_SECRET
    };
    sendRequest('oauth/access_token', 'POST', data, saveToken);

    function saveToken(data) {
        if (data && data.is_error) {
            callback(data);
            return;
        }

        TOKEN = data.access_token;
        var hashName = md5(API_USER_ID + '::' + API_SECRET);
        fs.writeFileSync(TOKEN_STORAGE + hashName, TOKEN);
        callback(TOKEN)
    }
}

/**
 * Form error object
 *
 *  @return object
 */
function returnError(message) {
    var data = {is_error: 1};
    if (message !== undefined && message.length) {
        data['message'] = message
    }
    return data;
}

/**
 * Serializing of the array
 *
 * @param mixed_value
 * @return string
 */
function serialize(mixed_value) {
    var val, key, okey,
        ktype = '',
        vals = '',
        count = 0,
        _utf8Size = function (str) {
            var size = 0,
                i = 0,
                l = str.length,
                code = '';
            for (i = 0; i < l; i++) {
                code = str.charCodeAt(i);
                if (code < 0x0080) {
                    size += 1;
                } else if (code < 0x0800) {
                    size += 2;
                } else {
                    size += 3;
                }
            }
            return size;
        },
        _getType = function (inp) {
            var match, key, cons, types, type = typeof inp;

            if (type === 'object' && !inp) {
                return 'null';
            }

            if (type === 'object') {
                if (!inp.constructor) {
                    return 'object';
                }
                cons = inp.constructor.toString();
                match = cons.match(/(\w+)\(/);
                if (match) {
                    cons = match[1].toLowerCase();
                }
                types = ['boolean', 'number', 'string', 'array'];
                for (key in types) {
                    if (cons == types[key]) {
                        type = types[key];
                        break;
                    }
                }
            }
            return type;
        },
        type = _getType(mixed_value);

    switch (type) {
        case 'function':
            val = '';
            break;
        case 'boolean':
            val = 'b:' + (mixed_value ? '1' : '0');
            break;
        case 'number':
            val = (Math.round(mixed_value) == mixed_value ? 'i' : 'd') + ':' + mixed_value;
            break;
        case 'string':
            val = 's:' + _utf8Size(mixed_value) + ':"' + mixed_value + '"';
            break;
        case 'array':
        case 'object':
            val = 'a';
            for (key in mixed_value) {
                if (mixed_value.hasOwnProperty(key)) {
                    ktype = _getType(mixed_value[key]);
                    if (ktype === 'function') {
                        continue;
                    }

                    okey = (key.match(/^[0-9]+$/) ? parseInt(key, 10) : key);
                    vals += serialize(okey) + serialize(mixed_value[key]);
                    count++;
                }
            }
            val += ':' + count + ':{' + vals + '}';
            break;
        case 'undefined':
        default:
            val = 'N';
            break;
    }
    if (type !== 'object' && type !== 'array') {
        val += ';';
    }
    return val;
}

/**
 * API interface implementation
 */



exports.init = init;
exports.sendRequest = sendRequest;
exports.getToken = getToken;
