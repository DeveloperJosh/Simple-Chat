const io = require('socket.io-client');
const socket = io("http://localhost:3000");
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
});

console.log("What is your name?");
rl.question("What is your name?", (text) => {
    socket.emit('new-user', text.trim());
    console.log("You joined the chat");
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