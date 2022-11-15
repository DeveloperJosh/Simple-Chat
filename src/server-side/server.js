const express = require('express');
const app = express();
const http = require('http');
const httpServer = http.createServer(app);
const rateLimit = require('express-rate-limit')
const io = require("socket.io")(httpServer, {
    cors: {
        origin: "localhost:3000",
        methods: ["GET", "POST"]
    }
});
require('dotenv').config()
const config = require("./server-config");
const PORT = process.env.PORT || config.server.port;
const limiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 50,
	standardHeaders: true,
	legacyHeaders: false,
})
app.use(limiter);

let users = {};
let rooms = {};
let room_owner = {};
let room_passwords = {};
let maxUsers = 90;
let user_color = {};
let bad_words = require("./bad_words.json");
let color_ = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m"
}

/**
 * @param {string} Color You can pick blue, green, red, yellow, magenta, cyan, white
 * @param {string} Text you can put any text you want
 * @usage console.log(colors("blue", "Hello World"))
 */
function colors(color, text) {
  if (color in color_) {
    return color_[color] + text + "\x1b[0m";
  }
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/pages/index.html');
  });

app.get('/chat', (req, res) => {
    res.sendFile(__dirname + '/pages/chat.html');
});

io.on("connection", (socket) => {
    // basic user login
        console.log("New Connection: " + socket.id);
        console.log("-----------------------------------------------------");
        socket.on('user', (name) => {
          console.log(`User: ${name}`)
          console.log("-----------------------------------------------------");
          users[socket.id] = name;
          /// if users is greater than maxUsers, we disconnect the user
          if (Object.keys(users).length > maxUsers) {
            socket.emit("message", `You will be disconnected because there are too many users, in 5 seconds.`);
            wait(5000).then(() => {
              socket.disconnect();
            });
          } else {
            socket.to("lobby").emit("message", `${name} joined the chat.`)
            // when the join add them to the default room called "lobby"
            socket.join("lobby");
            socket.emit("message", `You have joined the lobby, you can create a room by typing /room <room-name>`);
          }
    });

    socket.on("message", (message) => {
        // check if the message is in a room or public and or if it is a command
        if (message.startsWith("/")) {
            let command = message.split(" ")[0].replace("/", "");
            let args = message.split(" ").slice(1);
            switch (command) {
                case "help":
                    socket.emit("message", `Commands: 
/help - shows this message
/userlist - shows the userlist
/room - creates a room
/roomlist - shows the rooms
/join - joins a room
/leave - leaves a room
/password-room - sets a password for a room
/credits - shows the credits
                    `);
                    break;
                case "nick":
                    new_name = args.join(" ");
                    // check all the users and if the new name is already taken, we send a message to the user
                    for (let user in users) {
                        if (users[user] == new_name) {
                            socket.emit("message", `The name ${new_name} is already taken.`);
                            return;
                        }
                    }
                    // message can't be empty
                    if (new_name == "") {
                        socket.emit("message", `You can't set your name to nothing.`);
                        return;
                    }
                    // name cannot have spaces
                    if (new_name.includes(" ")) {
                        socket.emit("message", `Your name cannot have spaces.`);
                        return;
                    }

                    if (new_name.length > 20) {
                        socket.emit("message", "Your name is too long, please choose a shorter name.");
                        return;
                    }
                    if (new_name.length < 3) {
                        socket.emit("message", "Your name is too short, please choose a longer name.");
                        return;
                    }
                    // check if the name is a bad word
                    for (let word in bad_words) {
                        if (new_name.toLowerCase().includes(bad_words[word])) {
                            socket.emit("message", `Your name cannot contain the word ${bad_words[word]}.`);
                            return;
                        }
                    }
                    old_name = users[socket.id];
                    users[socket.id] = new_name;
                    socket.emit("message", `Your name has been changed from ${old_name} to ${new_name}`);
                    socket.to("lobby").emit("message", `${old_name} changed their name to ${new_name}`);
                    break;
                case "credits":
                    socket.emit("message", "Simple Chat by @DeveloperJosh");
                    break;
                case "userlist":
                    socket.emit("message", `There are ${Object.keys(users).length} users online.`);
                    socket.emit("message", "Userlist: " + Object.values(users).join(", "));
                    break;
                    case "rules":
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
                case "roomlist":
                    // tell the user how many rooms there are and what they are
                    socket.emit("message", `There are ${Object.keys(rooms).length} rooms.`);
                    socket.emit("message", "Rooms: " + Object.keys(rooms).join(", "));
                    // if they are in a room, tell them what room they are in, if not say they are in the public chat
                    if (socket.id in rooms) {
                        socket.emit("message", `You are in the room: ${rooms[socket.id]}`);
                    } else {
                        socket.emit("message", "You are in the public chat.");
                    }
                    break;
                case "room":
                    // make a room with a name and password and add the user to the room
                    if (args.length === 0) {
                        socket.emit("message", "Please enter a room name");
                    } else {
                        let room = args[0];
                        if (rooms[room] === undefined) {
                            rooms[room] = [];
                            rooms[room].push(users[socket.id]);
                            room_owner[room] = users[socket.id];
                            // leave lobby
                            socket.leave("lobby");
                            socket.join(room);
                            socket.emit("message", `You joined ${room}`);
                            socket.broadcast.to(room).emit("message", `${users[socket.id]} joined ${room}`);
                        } else {
                            socket.emit("message", "Room already exists");
                        }
                    }
                    break;
                case "join":
                    if (args.length === 0) {
                        socket.emit("message", "Please enter a room name");
                    } else {
                        let room = args[0];
                        if (rooms[room] === undefined) {
                            socket.emit("message", "Room does not exist");
                        } else {
                            if (room_passwords[room] !== undefined) {
                                if (args.length < 2) {
                                    socket.emit("message", `Room ${room} is password protected`);
                                } else {
                                    if (args[1] === room_passwords[room]) {
                                        rooms[room].push(users[socket.id]);
                                        socket.join(room);
                                        socket.emit("message", `You joined ${room}`);
                                        socket.broadcast.to(room).emit("message", `${users[socket.id]} joined ${room}`);
                                    } else {
                                        socket.emit("message", "Wrong password");
                                    }
                                }
                            // if user is admin, join the room without password
                            } else {
                                rooms[room].push(users[socket.id]);
                                socket.join(room);
                                socket.leave("lobby");
                                socket.emit("message", `You joined ${room}`);
                                socket.broadcast.to(room).emit("message", `${users[socket.id]} joined ${room}`);
                            }
                        }
                    }
                    break;
                case "leave":
                    for (let room in rooms) {
                        if (rooms[room].includes(users[socket.id])) {
                            rooms[room].splice(rooms[room].indexOf(users[socket.id]), 1);
                            socket.leave(room);
                            socket.join("lobby");
                            socket.emit("message", `You left ${room}`);
                            socket.broadcast.to(room).emit("message", `${users[socket.id]} left ${room}`);
                        }
                    }
                    break;
                case "password-room":
                    // check if the user is the owner of the room
                    let room_name = args[0];
                    let room_password = args[1];
                    if (room_owner[room_name] === users[socket.id]) {
                        room_passwords[room_name] = room_password;
                        socket.emit("message", `Password for room ${room_name} set to ${room_password}`);
                    } else {
                        socket.emit("message", "You are not the owner of this room");
                    }
                    break;
                    case "color":
                        /// get color and change it
                        const newColor = args[0];
                          /// check if color is in color_
                          if (color_[newColor] === undefined) {
                            /// show list
                            socket.emit("message", "Available colors: " + Object.keys(color_).join(", "));
                          } else {
                            /// change the color
                            user_color[socket.id] = newColor;
                            socket.emit("message", `Your color has been changed to ${newColor}.`);
                          } // end of else
                        break;
                default:
                    socket.emit("message", "Command not found");
            }
        } else {
            let room = undefined;
            for (let r in rooms) {
                if (rooms[r].includes(users[socket.id])) {
                    room = r;
                }
            }
            if (room === undefined) {

                /// check message for bad words and replace them with *
                for (let i = 0; i < bad_words.length; i++) {
                    message = message.replace(bad_words[i], "*".repeat(bad_words[i].length));
                } // end of for loop

                if (message.replace(/\s/g, "").length === 0) {
                    return;
                }
                io.to("lobby").emit("message", `${users[socket.id]}: ${message}`);
            }
            else {
                for (let i = 0; i < bad_words.length; i++) {
                    message = message.replace(bad_words[i], "*".repeat(bad_words[i].length));
                } // end of for loop

                if (message.replace(/\s/g, "").length === 0) {
                    return;
                }
                io.to(room).emit("message", `${users[socket.id]}: ${message}`);
            }
        }
    });

    // room creation
    socket.on("create_room", (room_name, password) => {
        // check if the room already exists
        if (rooms[room_name]) {
            socket.emit("message", `Room ${room_name} already exists.`);
        } else {
            // create the room
            rooms[room_name] = room_name;
            room_passwords[room_name] = password;
            socket.emit("message", `Room ${room_name} created.`);
        }
    });

    // room joining
    socket.on("join_room", (room_name, password) => {   
        // check if the room exists
        if (rooms[room_name]) {
            // check if the password is correct
            if (room_passwords[room_name] === password) {
                // join the room
                socket.join(room_name);
                socket.room = room_name;
                socket.emit("message", `Joined room ${room_name}.`);
            } else {
                socket.emit("message", `Wrong password for room ${room_name}.`);
            }
        } else {
            socket.emit("message", `Room ${room_name} does not exist.`);
        }
    });

    // room leaving
    socket.on("leave_room", () => {
        // check if the user is in a room
        if (socket.room) {
            socket.leave(socket.room);
            socket.emit("message", `Left room ${socket.room}.`);
            socket.room = null;
        } else {
            socket.emit("message", `You are not in a room.`);
        }
    });

    socket.on('disconnect', () => {
        /// check if user is in users
        if (users[socket.id] !== undefined) {
          socket.to("lobby").emit("message", `${users[socket.id]} left the chat.`);
          console.log("Disconnected: " + socket.id);
          console.log("-----------------------------------------------------");
          delete users[socket.id];
          delete rooms[socket.id];
          delete room_owner[socket.id]; 
          delete room_passwords[socket.id];
        } else {
          console.log("Disconnected: " + socket.id);
          console.log("-----------------------------------------------------");
        }
      });

});

httpServer.listen(PORT);
console.log("-----------------------------------------------------");
console.log(`Server is running on port ${PORT}`);
console.log(`Description: ${config.description}`);
console.log(`Version: ${config.version}`);
console.log(`Author: DeveloperJosh`);
build = `OS: ${process.platform}, Arch: ${process.arch}, Node: ${process.version}`;
console.log(`Build: ${build}`);
console.log("-----------------------------------------------------");