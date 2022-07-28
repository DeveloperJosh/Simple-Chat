//You may edit the code below, nut you may not edit the credits command.
const io = require("socket.io")();
const config = require("./server-config");

const PORT = process.env.PORT || config.server.port;

const users = {};
const votes = {};

/// we only allow 90 users to connect
const maxUsers = 90;

function wait(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}

io.on("connection", (socket) => {
  console.log("New Connection: " + socket.id);
  console.log("-----------------------------------------------------");
  socket.on('user', (name) => {
    users[socket.id] = name;
    /// if users is greater than maxUsers, we disconnect the user
    if (Object.keys(users).length > maxUsers) {
      socket.emit("message", `You will be disconnected because there are too many users, in 5 seconds.`);
      wait(5000).then(() => {
        socket.disconnect();
      });
    } else {
      socket.broadcast.emit("message", `${name}(${socket.id}) joined the chat.`)
    }
  });

  socket.on('message', (text) => {
    if (text.startsWith("/")) {
      const command = text.split(" ")[0];
      const args = text.split(" ").slice(1);
      switch (command) {
        case "/userlist":
          /// count the users 
          const userCount = Object.keys(users).length;
          socket.emit("message", `There is ${userCount}/${maxUsers} users online.`);
          socket.emit("message", "Userlist: " + Object.values(users).join(", "));
          break;
        case "/nick":
          /// get name and change it
          const newName = args.join(" ");
          newName.trim();
          /// if args is empty, we send a message to the user
          if (newName.length === 0) {
            socket.emit("message", "Please enter a name.");
          } else 
            if (Object.values(users).includes(newName)) {
              socket.emit("message", "This name is already in use.");
            } else {
              /// if the name is not in use, we change the name
              const oldName = users[socket.id];
              console.log("-----------------------------------------------------");
              console.log(`A user changed his name from ${oldName} to ${newName}`);
              console.log("-----------------------------------------------------");
              socket.broadcast.emit("message", `${oldName} changed his name to ${newName}`)
              users[socket.id] = newName;
            } // end of else
          break;
        case "/ping":
          //// send message then see how long it takes
          time_taken = socket.emit("message", "pinging...");
          /// round out the milliseconds
          time_taken = Math.round(time_taken * 100) / 100;
          socket.emit("message", `Pong! Took ${time_taken}ms.`);
          break;
        case "/clear":
          /// clear the screen
          socket.emit("message", "\x1b[2J\x1b[0f");
          socket.emit("message", "Cleared the screen.");
          break;
        case "/votekick":
          const idToKick = args[0];
          if (votes[idToKick] === undefined) {
            votes[idToKick] = 1;
            socket.emit("message", `You voted to kick ${idToKick}`);
            socket.broadcast.emit("message", `${socket.id} voted to kick ${idToKick} 1/50`);
          } else {
            votes[idToKick]++;
            socket.emit("message", `You voted to kick ${idToKick}`);
          } if (users[idToKick] === undefined) {
            socket.emit("message", `${idToKick} is not in the chat.`);
          } if (votes[idToKick] === 2) {
            socket.emit("message", `You have been kicked by ${idToKick}`);
            socket.broadcast.emit("message", `${idToKick} has been kicked.`);
            console.log("-----------------------------------------------------");
            console.log(`${idToKick} has been kicked.`);
            console.log("-----------------------------------------------------");
            delete users[idToKick];
            delete votes[idToKick];
          }
          break;
        case "/rules":
          socket.emit("message", 
`
Rules:
1. No spamming
2. No Racism or Hate Speech
3. No NSFW content
4. Be respectful to other users
5. No advertising
6. No being homophobic or transphobic
`);
          break;
        case "/help":
          socket.emit("message", "Commands: /nick, /help, /userlist, /ping, /rules, /clear, /votekick(In development)");
          break;
        default:
          socket.emit("message", "Unknown command.");
      }
    } else {
      /// if there is no name then do not send message
      if (users[socket.id]) {
        socket.broadcast.emit("message", `${users[socket.id]}: ${text}`);
      } else {
        socket.emit("message", "It looks like the server may have been reset please reconnect.\nYou can type '/help' for a list of commands.");
      }
    }
  });

  socket.on('disconnect', () => {
    socket.broadcast.emit("message", `${users[socket.id]} left the chat.`);
    console.log("Disconnected: " + socket.id);
    console.log("-----------------------------------------------------");
    delete users[socket.id];
  });

});

io.listen(PORT);
/// check version
console.log("-----------------------------------------------------");
console.log(`Server is running on port ${PORT}`);
console.log("Desscription: " + config.description);
console.log(`Version: ${config.version}`);
console.log(`Author: ${config.author}`);
build = `${process.platform} ${process.arch} ${process.version}`;
console.log(`Build: ${build}`);
console.log("-----------------------------------------------------");