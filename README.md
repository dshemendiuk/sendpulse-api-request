# SendPulse API Request
A simple [SendPulse API](https://sendpulse.com/api) client wrapper for Node.js.


### Install

```
npm install sendpulse-api-request
```

### Usage
This module helps you with authorization and you just perform requests to native SendPulse API methods endpoints with specific parameters. 

```javascript
const sendpulse = require("sendpulse-api-request");
const TOKEN_STORAGE = "/tmp/";

/*
 * Initialization with SendPulse credentials https://login.sendpulse.com/settings/#api
 */
sendpulse.init("USER_ID", "USER_SECRET", TOKEN_STORAGE, function() {console.log});

/*
 * Get a list of WhatsApp chats (https://sendpulse.com/integrations/api/chatbot/whatsapp#/chats/get_chats)
 */
sendpulse.sendRequest("/whatsapp/chats", "GET", {"bot_id": "XXXXXXXXXXXX"}, function(data) {
    console.log(JSON.stringify(data))
});

/*
 * Send a WhatsApp message to a phone number (https://sendpulse.com/integrations/api/chatbot/whatsapp#/contacts/post_contacts_sendByPhone)
 */
sendpulse.sendRequest("/whatsapp/contacts/sendByPhone", "POST", {
    "bot_id": "XXXXXXXXXXXX",
    "phone": "1XXXXXXXXXX",
    "message": {
        "type": "text",
        "text": {
            "body": "sample text"
        }
    }
}, function(data) {
    console.log(data)
});
```

