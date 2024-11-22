const express = require('express')
const connectToMongo = require('./db')
const router = require('./Routes/auth.js')
const app = express()
const port = 5000 // Use the PORT environment variable if it exists
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
var cors = require('cors');
const User = require('./Models/User.js')

require('dotenv').config();
connectToMongo()
const connections = {}; // Store user connections based on uid

wss.on('connection', (ws) => {
    let uid; // Track the current user's UID

    ws.on('message', async (message) => {
        const data = JSON.parse(message);

        if (data.type === 'join') {
            // Fetch user by UID
            const user = await User.findOne({ _id: data.uid });
            if (!user) {
                ws.send(JSON.stringify({ type: 'error', message: 'User not found' }));
                return;
            }

            uid = data.uid; // Set the UID for this connection
            if (connections[uid]) {
                ws.send(JSON.stringify({ type: 'error', message: 'You are already connected' }));
                return;
            }

            connections[uid] = ws; // Map the WebSocket to this UID
            console.log(`${uid} joined`);

            // Notify the user that they are connected
            ws.send(JSON.stringify({ type: 'status', message: 'Waiting for opponent...' }));

            // Find a free opponent
            const opponentUid = Object.keys(connections).find(async (id) => {
                const user = await User.findOne({ _id: id });
                return id !== uid && user.isFree;
            });

            if (opponentUid) {
                const opponentWs = connections[opponentUid];

                // Notify both users that the game is ready
                ws.send(JSON.stringify({ type: 'ready', opponentUid }));
                opponentWs.send(JSON.stringify({ type: 'ready', opponentUid: uid }));

                // Update isFree to false for both users
                await User.updateMany(
                    { _id: { $in: [uid, opponentUid] } },
                    { $set: { isFree: false } }
                );
            } else {
                // Notify the user that no one is online
                ws.send(JSON.stringify({ type: 'error', message: 'No one is online. Try again later.' }));
                delete connections[uid]; // Remove the connection since no game was created
            }
        } else if (data.type === 'click') {
            // Handle button click and notify both users
            const opponentUid = Object.keys(connections).find((id) => id !== uid);
            if (opponentUid && connections[opponentUid]) {
                // Notify both players of the result
                connections[uid].send(
                    JSON.stringify({ type: 'result', winner: uid, message: 'You Win!' })
                );
                connections[opponentUid].send(
                    JSON.stringify({ type: 'result', winner: uid, message: 'You Lose!' })
                );

                // Mark both users as free after the game
                await User.updateMany(
                    { _id: { $in: [uid, opponentUid] } },
                    { $set: { isFree: true } }
                );
            } else {
                ws.send(JSON.stringify({ type: 'error', message: 'Opponent not found.' }));
            }
        }
    });

    ws.on('close', async () => {
        console.log(`${uid} disconnected`);
        delete connections[uid]; // Remove the connection when the user disconnects

        // Mark the user as free if they disconnect during a game
        if (uid) {
            await User.updateOne({ _id: uid }, { $set: { isFree: true } });
        }
    });
});

console.log('WebSocket server running on http://localhost:8080');


app.use(cors());
app.use(express.json());
app.use('/api/auth', require("./Routes/auth"))
app.use('/api/judgeapi', require("./Routes/judgeapi"))


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

module.exports = router