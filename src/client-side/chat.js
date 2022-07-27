const io = require('socket.io-client');
const socket = io("https://AgreeableExhaustedGenres.developerjosh.repl.co");
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
});

console.log("What is your name?");
rl.question("What is your name?", (text) => {
    socket.emit('user', text.trim());
    console.log("You joined the chat");
    console.log("Type '/help' for a list of commands, Also type '/rules' for the rules");
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