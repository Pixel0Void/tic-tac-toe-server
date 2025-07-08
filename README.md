
# 🕹️ Tic-Tac-Toe Server

A real-time server for the classic Tic-Tac-Toe game, built using **Node.js**, **TypeScript**, and **Socket.IO**.

## 🚀 Features

- 🧠 Matchmaking for two players
- 🔄 Real-time communication via WebSockets
- ⏱️ Turn-based logic handling
- ❌ Win/Draw detection logic
- 🧼 Clean TypeScript structure
- 🛡️ Error handling and simple validations

## 🛠️ Tech Stack

- **Node.js**
- **TypeScript**
- **Socket.IO**

## 📁 Project Structure

```
src/
├── index.ts         	   # Entry point
├── gameLogic.ts     # Game logic for checking win/draw/turns
├── room.ts            # Handling game rooms
└── dataTypes.ts     # Custom TypeScript types
```

## 🧪 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v22.16.0)
- npm

### Installation

```bash
git clone https://github.com/Pixel0Void/tic-tac-toe-server.git
cd tic-tac-toe-server
npm install
```

### Run the Server

```bash
npm run dev
```

Server will run on [http://localhost:3000](http://localhost:3000) by default.

## 📡 Socket Events

Here are some of the key events the server handles:

| Event             | Description                     |
|------------------|---------------------------------|
| `findMatch`      | Finding a match                |
| `playerAssigned`      | Finding a room and assign a symbol to player                |
| `roomJoined`      | Found a room and joining to it                |
| `gameReady`      | Game is ready                |
| `gameStateUpdate`     | Sending game state |
| `makeMove`      | Send a player's move            |
| `gameOver`      | Notify win/draw                 |
| `resetGame`      | Notify end game                |
| `disconnect`     | Handle player disconnection     |
| `playerDisconnected`     | Notify opponent when disconnection     |
| `error`      | Error handeling                |

---

Feel free to contribute or fork the project. 🎯
