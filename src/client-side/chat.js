const io = require('socket.io-client');
const config = require('./client-config');
const socket = io(config.server.url);
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
});

console.log("Simple Chat Client");
console.log("");
console.log("What do you want to call yourself?");
rl.question("What do you want to call yourself?", (text) => {
    socket.emit('user', text.trim());
    /// send the user id to the user
    if (socket.id) {
        console.log("")
        console.log(`Your Id: ${socket.id}`);
        console.log("Type '/help' for a list of commands, Also type '/rules' for the rules.");
    } else {
        console.log("It looks something went wrong. Please reconnect.\nUse Ctrl+C to exit.\nYou can reload the applicetion after that.");
    }
    process.stdout.write("> ");
});

socket.on("message", (text) => {
    // Erasing Last line
    process.stdout.write("\r\x1b[K")
    console.log(text);
    process.stdout.write("> ");
});

rl.prompt();

rl.on('line', (text) => {
    socket.emit('message', text.trim());
    process.stdout.write("> ");
    rl.prompt();
});