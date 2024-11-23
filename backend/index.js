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
const waitingQueue = []; // Queue for users waiting to connect
const activeMatches = {}; // Track active matches { matchId: [uid1, uid2] }

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

            uid = data.uid;

            if (connections[uid]) {
                ws.send(JSON.stringify({ type: 'error', message: 'You are already connected' }));
                return;
            }

            connections[uid] = ws; // Map the WebSocket to this UID
            console.log(`${uid} joined`);

            // Check if there's a waiting user
            if (waitingQueue.length > 0) {
                const opponentUid = waitingQueue.shift(); // Get the first user from the queue
                const opponentWs = connections[opponentUid];

                // Notify both users that the game is ready
                ws.send(JSON.stringify({ type: 'ready', opponentUid }));
                opponentWs.send(JSON.stringify({ type: 'ready', opponentUid: uid }));

                // Mark the match as active
                const matchId = `${uid}-${opponentUid}`;
                activeMatches[matchId] = [uid, opponentUid];

                // Update isFree to false for both users
                await User.updateMany({ _id: { $in: [uid, opponentUid] } }, { $set: { isFree: false } });

                console.log(activeMatches)
            } else {
                // Add the user to the waiting queue
                waitingQueue.push(uid);
                console.log("You are in the queue")
                ws.send(JSON.stringify({ type: 'status', message: 'Waiting for an opponent...' }));
            }
        } else if (data.type === 'click') {
            // Handle button click and notify both users
            const match = Object.entries(activeMatches).find(([_, players]) => players.includes(uid));
            if (match) {
                const [matchId, players] = match;
                const opponentUid = players.find((id) => id !== uid);

                if (connections[uid] && connections[opponentUid]) {
                    connections[uid].send(JSON.stringify({ type: 'result', winner: uid, message: 'You Win!' }));
                    connections[opponentUid].send(JSON.stringify({ type: 'result', winner: uid, message: 'You Lose!' }));

                    // End the match and free both users
                    delete activeMatches[matchId];
                    await User.updateMany(
                        { _id: { $in: [uid, opponentUid] } },
                        { $set: { isFree: true } }
                    );

                    // Notify waiting users if any
                    if (waitingQueue.length > 0) {
                        const newOpponentUid = waitingQueue.shift();
                        const newOpponentWs = connections[newOpponentUid];

                        // Notify the next pair
                        connections[uid].send(JSON.stringify({ type: 'ready', opponentUid: newOpponentUid }));
                        newOpponentWs.send(JSON.stringify({ type: 'ready', opponentUid: uid }));

                        // Start a new match
                        const newMatchId = `${uid}-${newOpponentUid}`;
                        activeMatches[newMatchId] = [uid, newOpponentUid];

                        // Update isFree to false for both users
                        await User.updateMany(
                            { _id: { $in: [uid, newOpponentUid] } },
                            { $set: { isFree: false } }
                        );
                    }
                }
            }
        }
    });

    ws.on('close', async () => {
        console.log(`${uid} disconnected`);
        delete connections[uid]; // Remove the connection when the user disconnects

        // Remove user from waiting queue if present
        const queueIndex = waitingQueue.indexOf(uid);
        if (queueIndex !== -1) waitingQueue.splice(queueIndex, 1);

        // End the match if the user was in an active match
        const match = Object.entries(activeMatches).find(([_, players]) => players.includes(uid));
        if (match) {
            const [matchId, players] = match;
            const opponentUid = players.find((id) => id !== uid);

            // Notify the opponent that the user disconnected
            if (connections[opponentUid]) {
                connections[opponentUid].send(JSON.stringify({ type: 'error', message: 'Opponent disconnected' }));
                waitingQueue.push(opponentUid); // Re-add the opponent to the queue
            }

            delete activeMatches[matchId]; // Remove the match
            console.log(matchId, 'ended');
            await User.updateOne({ _id: uid }, { $set: { isFree: true } });
        }
    });
});

console.log('WebSocket server running on http://localhost:8080');

console.log('WebSocket server running on http://localhost:8080');



app.use(cors());
app.use(express.json());
app.use('/api/auth', require("./Routes/auth"))
app.use('/api/judgeapi', require("./Routes/judgeapi"))


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

module.exports = router