//You may edit the code below, nut you may not edit the credits command.
const io = require("socket.io")();
const config = require("./server-config");

const PORT = process.env.PORT || config.server.port;

const users = {};
const votes = {};
const admins = {};
const admin_clients = {};

/// we only allow 90 users to connect
const maxUsers = config.server.maxUsers;
const maxVotes = config.server.maxVotes;

function wait(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}

io.on("connection", (socket) => {
  console.log("New Connection: " + socket.id);
  console.log("-----------------------------------------------------");
  socket.on('user', (name) => {
    console.log("User: " + name);
    console.log("-----------------------------------------------------");
    users[socket.id] = name;
    /// if users is greater than maxUsers, we disconnect the user
    if (Object.keys(users).length > maxUsers) {
      socket.emit("message", `You will be disconnected because there are too many users, in 5 seconds.`);
      wait(5000).then(() => {
        socket.disconnect();
      });
    } else {
      socket.broadcast.emit("message", `${name}(${socket.id}) joined the chat.`)
    } //// check if user is logging in from the admin client
  });

  socket.on("admin", (name) => {
    socket.emit("message", `Please run /admin and enter your password.`);
    users[socket.id] = name;
    /// add to admins clients list
    admin_clients[socket.id] = socket;
    console.log("-----------------------------------------------------");
    console.log(`${name}(${socket.id}) is connected on a admin client.\nIf user is not a admin please update the password.`);
    console.log("-----------------------------------------------------");
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
          timer = new Date().getTime();
          timer = timer - (timer % 1000);
          socket.emit("message", `Pong! ${timer}ms`);
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
            socket.emit("message", `You voted to kick ${users[idToKick]}`);
            socket.broadcast.emit("message", `${socket.id} voted to kick ${users[idToKick]} 1/${maxVotes}`);
          } else {
            votes[idToKick]++;
            socket.emit("message", `You voted to kick ${idToKick}`);
          } if (users[idToKick] === undefined) {
            socket.emit("message", `${idToKick} is not in the chat.`);
          } if (votes[idToKick] === maxVotes) {
            socket.broadcast.emit("message", `${users[idToKick]} has been kicked.`);
            console.log("-----------------------------------------------------");
            console.log(`${users[idToKick]} has been kicked.`);
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
          /// if the user is an admin, we send the admin help
          if (admins[socket.id] !== undefined) {
            socket.emit("message", "Admin commands: /help");
            socket.emit("message", "");
            socket.emit("message", "Commands: /nick, /help, /userlist, /ping, /rules, /clear, /votekick(In development)");
          } else {
            socket.emit("message", "Commands: /nick, /help, /userlist, /ping, /rules, /clear, /votekick(In development)");
          }
          break;
        case "/admin":
          /// ask for the password
          admin_password = args[0];

          if (admin_clients[socket.id] === undefined) {
            socket.emit("message", `You are not an admin.`);
            return;
          }

          if (admin_password === config.server.adminpassword) {
            admins[socket.id] = users[socket.id]; 
            console.log("Admin: " + users[socket.id]);
            console.log("-----------------------------------------------------");
            socket.emit("message", `Welcome ${users[socket.id]}!`);
            socket.broadcast.emit("message", `Admin ${users[socket.id]} joined the chat.`)
            } else {
              socket.emit("message", `Incorrect password.`);
            } /// if user is not in admin_clients, give error
          break;
        default:
          socket.emit("message", "Unknown command.");
      }
    } else {
      /// if admin color text
      if (admins[socket.id] !== undefined) {
        socket.broadcast.emit("message", `\x1b[33m${admins[socket.id]}: ${text} \x1b[0m`);
        return;
      }
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
console.log(`Description: ${config.description}`);
console.log(`Version: ${config.version}`);
console.log(`Author: ${config.author}`);
build = `OS: ${process.platform}, Arch: ${process.arch}, Node: ${process.version}`;
console.log(`Build: ${build}`);
console.log("-----------------------------------------------------");
checkVersion();