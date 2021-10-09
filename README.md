# SendPulse API Request
A simple SendPulse API client library for Node.js

API Documentation [https://sendpulse.com/api](https://sendpulse.com/api)

### Install

```
npm install sendpulse-api-request
```

### Usage

```javascript
var sendpulse = require("sendpulse-api-request");
/*
 * https://login.sendpulse.com/settings/#api
 */
var API_USER_ID = "USER_ID";
var API_SECRET = "USER_SECRET";
var TOKEN_STORAGE = "/tmp/";

sendpulse.init(API_USER_ID, API_SECRET, TOKEN_STORAGE, function() {
    sendpulse.sendRequest("/whatsapp/account", "GET", {}, function(data) {
        console.log(data)
    });
});
```

