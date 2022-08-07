## Deployment

In order to run the server you need to do a few things.

First you need to edit the password for the admin client.

Here is the config with the stuff you need to edit

Server-Config.json
```jsonc
{
    "version": "v2.0", /// keep this
    "name": "Simple Chat Server", // edit this
    "description": "A simple chat server, written in Js.", // edit this
    "server": {
        "port": 3000, // you can edit or keep it
        "maxUsers": 90, // keep or edit
        "maxVotes": 15
    }
}
```

Make a .env file outside of the server folder and the src folder.
```
PASSWORD=password
```
This is the password for the admin login.

How to run the server

```bash
   npm install
   npm start
```

And boom you have a server running.

If you need any help, you can ask me on [discord](https://discord.gg/kV8HP2qa2j)