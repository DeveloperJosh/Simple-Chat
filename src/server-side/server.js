const io = require("socket.io")();
const config = require("./config");

const PORT = process.env.PORT || 3000;

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
          /// get old name
          const oldName = users[socket.id];
          console.log(`A user changed his name from ${oldName} to ${newName}`);
          socket.broadcast.emit("message", `${oldName} changed his name to ${newName}`)
          users[socket.id] = newName;
          break;
        case "/ping":
          //// send message then see how long it takes
          time_taken = socket.emit("message", "pinging...");
          /// round out the milliseconds
          time = Math.round(time_taken);
          time = time / 1000;
          wait = time.toFixed(9);
          socket.emit("message", `Pong! Took ${wait} seconds.`);
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
        socket.emit("message", "It looks something went wrong. Please reconnect.\nYou can type '/help' for a list of commands.");
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
console.log(`Server is running on port ${PORT}`);
console.log(`Version: ${config.version}`);
console.log(`Build: ${config.build}`);
console.log("-----------------------------------------------------");