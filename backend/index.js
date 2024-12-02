const express = require('express')
const connectToMongo = require('./db')
const router = require('./Routes/auth.js')
const app = express()
const port = 5000 // Use the PORT environment variable if it exists
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
const notificationWSS = new WebSocket.Server({ port: 8081 });

var cors = require('cors');
const User = require('./Models/User.js')
const Question = require('./Models/Questions.js')
require('dotenv').config();
connectToMongo()
const connections = {}; // Store user connections based on uid
const waitingQueue = []; // Queue for users waiting to connect
const activeMatches = {}; // Track active matches { matchId: [uid1, uid2] }
const notificationConnections = {};

const activeGames = {}; // To store active game sessions
const waitingPlayers = {}; // To store players waiting for a response


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
                const questions = await Question.aggregate([{ $sample: { size: 1 } }]);


                ws.send(JSON.stringify({ type: 'ready', opponentUid, question: questions[0] }));
                opponentWs.send(JSON.stringify({ type: 'ready', opponentUid: uid, question: questions[0] }));

                // Mark the match as active
                const matchId = `${uid}-${opponentUid}`;
                activeMatches[matchId] = [uid, opponentUid];

                // Send the question to the frontend
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
        else if (data.type === 'friendGame') {
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
            console.log(activeGames);
            if (activeGames[data.sessionId]) {
                const players = activeGames[data.sessionId]; // Array of players
                console.log(players);
                const opponentUid = players.find((player) => player !== uid); // Get the opponent's UID
                console.log(opponentUid);
                const opponentUser = await User.findById(opponentUid);
                if(!opponentUser.isFree)
                {
                    ws.send(JSON.stringify({ type: 'error', message: 'Opponent is busy' }));
                    return;
                }
                if (!opponentUid) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Opponent not found in the game session' }));
                    return;
                }
        
                const opponentWs = connections[opponentUid];
                // console.log(opponentWs);
                if (!opponentWs || opponentWs.readyState !== WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Opponent is not connected' }));
                    return;
                }
        
                console.log(`Opponent UID: ${opponentUid}`);
                // console.log(`Connections:`, connections);
        
                // Notify both users that the game is ready
                const questions = await Question.aggregate([{ $sample: { size: 1 } }]);
        
                ws.send(JSON.stringify({ type: 'ready', opponentUid, question: questions[0] }));
                opponentWs.send(JSON.stringify({ type: 'ready', opponentUid: uid, question: questions[0] }));
        
                // Mark the match as active
                const matchId = `${uid}-${opponentUid}`;
                activeMatches[matchId] = [uid, opponentUid];
        
                // Update isFree to false for both users
                await User.updateMany({ _id: { $in: [uid, opponentUid] } }, { $set: { isFree: false } });
        
                console.log(activeMatches);
            } else {
                // Add the user to the waiting queue
                waitingQueue.push(uid);
                console.log("You are in the queue");
                ws.send(JSON.stringify({ type: 'status', message: 'Waiting for an opponent...' }));
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

notificationWSS.on('connection', (ws, req) => {
    let uid;

    ws.on('message', async (message) => {
        const data = JSON.parse(message);

        if (data.type === 'register') {
            uid = data.uid;
            if (!notificationConnections[uid]) {
                notificationConnections[uid] = ws;
                const user = await User.findByIdAndUpdate(uid, { isFree: true });
                broadcastFriendStatus(uid, true, true);
                console.log(`User ${uid} connected for notifications`);
            }
        } else if (data.type === 'unsubscribe') {
            if (uid && notificationConnections[uid]) {
                delete notificationConnections[uid];
                console.log(`User ${uid} unsubscribed from notifications`);
            }
        } else if (data.type === 'challenge') {
            // First player sends a challenge
            const targetWs = notificationConnections[data.to];
            if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                // Notify the challenged player
                targetWs.send(
                    JSON.stringify({
                        type: 'challenge',
                        from: data.from,
                        to: data.to,
                        message: data.message,
                    })
                );

                // Store the first player in waitingPlayers
                waitingPlayers[data.from] = data.to;
            }
        } else if (data.type === 'challengeResponse') {
            if (data.accept) {
                console.log(data);

                // Second player accepts the challenge
                const challenger = data.from; // The player who initiated the challenge
                const accepter = data.to; // The player who accepted the challenge

                // Create a unique game session
                if (waitingPlayers[challenger] !== accepter) {
                    const sessionId = `game-${Date.now()}-${challenger}-${accepter}`;
                    activeGames[sessionId] = [challenger, accepter];

                    console.log(`Game session started: ${sessionId}`);

                    // Notify both players to start the game and include the sessionId
                    [challenger, accepter].forEach((playerId) => {
                        const playerWs = notificationConnections[playerId];
                        if (playerWs && playerWs.readyState === WebSocket.OPEN) {
                            playerWs.send(
                                JSON.stringify({
                                    type: 'startGame',
                                    sessionId, // Include the sessionId in the message
                                    message: `Game session started!`,
                                })
                            );
                        }
                    });

                    console.log(activeGames);
                }
                // Remove from waitingPlayers
                delete waitingPlayers[challenger];
            } else {
                // Notify the challenger that the challenge was declined
                console.log("The opponent: " + data.to)
                console.log("The Homo: " + data.from)
                const challengerWs = connections[data.from];
                const recieverWs = notificationConnections[data.to];
                
                if (challengerWs && challengerWs.readyState === WebSocket.OPEN) {
                    challengerWs.send(
                        JSON.stringify({
                            type: 'challengeDeclined',
                            message: `Your challenge was declined.`,
                        })
                    );
                }

                if (recieverWs && recieverWs.readyState === WebSocket.OPEN) {
                    recieverWs.send(
                        JSON.stringify({
                            type: 'challengeDeclined',
                            message: `Your challenge was declined.`,
                        })
                    );
                }

                delete waitingPlayers[data.from];
            }
        }
    });

    ws.on('close', () => {
        if (uid && notificationConnections[uid]) {
            delete notificationConnections[uid];
            broadcastFriendStatus(uid, true, false);
            console.log(`User ${uid} disconnected from notifications`);

            // Remove from waitingPlayers if disconnected
            for (const [challenger, accepter] of Object.entries(waitingPlayers)) {
                if (challenger === uid || accepter === uid) {
                    delete waitingPlayers[challenger];
                    console.log(`Removed waiting player: ${uid}`);
                }
            }

        }
    });
});

const sendNotification = (uid, message) => {
    const userWs = notificationConnections[uid];
    if (userWs && userWs.readyState === WebSocket.OPEN) {
        userWs.send(JSON.stringify({ type: 'notification', message }));
    }
};

const broadcastFriendStatus = (friendId, isOnline, isFree) => {
    const data = JSON.stringify({
        type: 'statusUpdate',
        friendId,
        isFree,
        isOnline 
    });
    Object.values(notificationConnections).forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
    });
};


// Function to broadcast notifications to all connected users
const broadcastNotification = (message) => {
    Object.values(notificationConnections).forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'notification', message }));
        }
    });
};

// Example: Send notifications based on some event
setInterval(() => {
    broadcastNotification('This is a live update for all users!');
}, 30000); // Broadcast every 30 seconds



console.log('WebSocket server running on http://localhost:8080');
console.log('Notification WebSocket server running on http://localhost:8081');


app.use(cors());
app.use(express.json());
app.use('/api/auth', require("./Routes/auth"))
app.use('/api/judgeapi', require("./Routes/judgeapi"))
app.use('/api/user', require("./Routes/user"))


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

module.exports = router