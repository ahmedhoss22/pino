// socket.js
const socketIO = require("socket.io");
let attendees1 = [];
let attendees2 = [];

let io;

function initializeSocket(server) {
  io = socketIO(server);

  io.on("connection", (socket) => {
    console.log("A user connected with socket ID:", socket.id);

    // Handle reconnection events
    socket.on("disconnect", (reason) => {
      console.log(
        `User disconnected with socket ID ${socket.id}. Reason: ${reason}`
      );
    });

    const handleSubmission = ({ phone, message, branch }, reject = false) => {
      const attendees = branch == 1 ? attendees1 : attendees2;

      attendees.forEach((ele) => {
        if (ele.phone === phone && !reject) {
          io.to(ele.id).emit("welcomeMessage", message);
        } else {
          ele.order -= 1;
          io.to(ele.id).emit("recent-data", ele);
        }
      });
    };

    socket.on("acceptSubmission", (data) => {
      handleSubmission(data);
    });

    socket.on("reject", (data) => {
      handleSubmission(data, true);
    });

    socket.on("associateSocketId", ({ id, phone, branch, order }) => {
      if (branch == 1) {
        attendees1.push({ id, phone, order });
      } else {
        attendees2.push({ id, phone, order });
      }
      io.emit("associateSocketId", { id, phone });
    });
    socket.on("recent-data", (data) => {
      if (!data.phone || !data.id || !data.branch) {
        return;
      }
      if (data.branch == 1) {
        attendees1 = attendees1.map((ele) => {
          if (ele?.phone == data?.phone) {
            io.emit("recent-data", ele);
            return data;
          } else {
            return ele;
          }
        });
      } else {
        attendees2 = attendees2.map((ele) => {
          if (ele?.phone == data?.phone) {
            io.emit("recent-data", ele);
            return data;
          } else {
            return ele;
          }
        });
      }
    });
  });

  return io;
}

function getIo() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }
  return io;
}

module.exports = { initializeSocket, getIo };
