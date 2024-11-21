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
                console.log("User not found")
                ws.send(JSON.stringify({ type: 'error', message: 'User not found' }));
                return;
            }

            uid = data.uid; // Set the UID for this connection
            connections[uid] = ws; // Map the WebSocket to this UID
            console.log(`${uid} joined`);

            // Notify the user that they are connected
            ws.send(JSON.stringify({ type: 'status', message: 'Waiting for opponent...' }));

            // Check if another user is connected
            const opponentUid = Object.keys(connections).find((id) => id !== uid);
            if (opponentUid) {
                const opponentWs = connections[opponentUid];

                // Notify both users that the game is ready
                ws.send(JSON.stringify({ type: 'ready', opponentUid }));
                opponentWs.send(JSON.stringify({ type: 'ready', opponentUid: uid }));
            }
        } else if (data.type === 'click') {
            // Handle button click and notify both users
            if (connections[uid]) {
                const opponentUid = Object.keys(connections).find((id) => id !== uid);
                if (opponentUid && connections[opponentUid]) {
                    connections[uid].send(JSON.stringify({ type: 'result', winner: uid, message: 'You Win!' }));
                    connections[opponentUid].send(JSON.stringify({ type: 'result', winner: uid, message: 'You Lose!' }));
                }
            }
        }
    });

    ws.on('close', () => {
        console.log(`${uid} disconnected`);
        delete connections[uid]; // Remove the connection when the user disconnects
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