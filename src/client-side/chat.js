const io = require('socket.io-client');
const config = require('./client-config');
const socket = io(config.server.url);
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
});

console.log(`We are attempting to connect to ${config.server.url}`);
socket.on('connect', () => {
console.clear();

console.log("Simple Chat Client");
console.log("");
console.log("What do you want to call yourself?");
rl.question("What do you want to call yourself?", (text) => {
    socket.emit('user', text.trim());
    /// send the user id to the user
    console.log("")
    console.log(`Your Id: ${socket.id}`);
    console.log("Type '/help' for a list of commands, Also type '/rules' for the rules.");
    process.stdout.write("> ");
  });
});

socket.on("connect_error", (err) => {
    /// say that we failed to connect then try again
    console.log("");
    console.log("Failed to connect to the server.\nPlease contact the server owner.");
});

socket.on("message", (text) => {
        process.stdout.write("\r\x1b[K")
        console.log(text);
        process.stdout.write("> ");
});

// listen for the "disconnect" event
socket.on("disconnect", () => {
    console.log("\nDisconnected from server.\nAsk the admin of the server to check the server status.");
});

rl.prompt();

rl.on('line', (text) => {
    socket.emit('message', text.trim());
    process.stdout.write("> ");
    rl.prompt();
});
