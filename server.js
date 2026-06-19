const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const HISTORY_FILE = path.join(__dirname, 'messages.json');

let messages = [];
if (fs.existsSync(HISTORY_FILE)) {
  try {
    messages = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch (e) {
    messages = [];
  }
}

function saveMessages() {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(messages, null, 2));
}

app.use(express.static('public'));

app.post('/reset', (req, res) => {
  messages = [];
  saveMessages();
  io.emit('reset');
  res.json({ ok: true });
});

app.get('/captain', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/architect', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.emit('history', messages);

  socket.on('join', (role) => {
    socket.role = role;
    console.log(`${role} joined`);
  });

  socket.on('message', (data) => {
    const msg = {
      role: data.role,
      text: data.text,
      timestamp: Date.now()
    };
    messages.push(msg);
    saveMessages();
    io.emit('message', msg);
  });

  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', data);
  });

  socket.on('stop-typing', (data) => {
    socket.broadcast.emit('stop-typing', data);
  });

  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3333;
server.listen(PORT, () => {
  console.log(`Space Comms Terminal running on http://localhost:${PORT}`);
  console.log(`  Captain: http://localhost:${PORT}/captain`);
  console.log(`  Architect: http://localhost:${PORT}/architect`);
});
