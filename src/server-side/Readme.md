## Deployment

In order to run the server you need to do a few things.

First you need to edit the password for the admin client.

Here is the config with the stuff you need to edit

Server-Config.json
```json
{
    "version": "v2.0", /// keep this
    "name": "Simple Chat Server", // edit this
    "description": "A simple chat server, written in Js.", // edit this
    "author": "DeveloperJosh", // keep this
    "server": {
        "port": 3000, // you can edit or keep it
        "maxUsers": 90, // keep or edit
        "maxVotes": 15, //keep or edit
        "adminpassword": "password" // edit this
    }
}
```

Once you edited what you need run the exe or the js file

What you need to run the js file

+ Node v12 or 16
+ Socket.io
+ Socket.io-client