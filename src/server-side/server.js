const io = require("socket.io")();

const PORT = process.env.PORT || 3000;

const users = {};

io.on("connection", (socket) => {
  console.log("New Connection: " + socket.id);
  socket.on('user', (name) => {
    users[socket.id] = name;
    /// tell the user to read the rules
    socket.broadcast.emit("message", `${name} joined the chat.`)
  });

  socket.on('message', (text) => {
    if (text.startsWith("/")) {
      const command = text.split(" ")[0];
      const args = text.split(" ").slice(1);
      switch (command) {
        case "/userlist":
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
        case "/leave":
          delete users[socket.id];
          socket.disconnect();
          break;
        case "/ping":
          //// send message then see how long it takes
          time_taken = socket.emit("message", "pinging...");
          /// round out the milliseconds
          time = Math.round(time_taken);
          time = time / 1000;
          socket.emit("message", `ping: ${time} ms`);
          break;
        case "/rules":
          socket.emit("message", `
          Rules:
          1. No spamming
          2. No Racism or Hate Speech
          3. No NSFW content
          4. Be respectful to other users
          5. No advertising`);
          break;
        case "/help":
          socket.emit("message", "Commands: /nick, /help, /userlist, /leave, /ping");
          break;
        default:
          socket.emit("message", "Unknown command.");
      }
    } else {
      /// if there is no name then do not send message
      if (users[socket.id]) {
        socket.broadcast.emit("message", `${users[socket.id]}: ${text}`);
      } else {
        socket.emit("message", "You are not in the chat.");
      }
    }
  });

  socket.on('disconnect', () => {
    socket.broadcast.emit("message", `${users[socket.id]} left the chat.`);
    console.log("Disconnected: " + socket.id);
    delete users[socket.id];
  });

});

io.listen(PORT);