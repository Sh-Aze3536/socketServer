const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins (for testing)
    },
});

// Store connected users and their socket IDs
const users = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Register user with their unique ID
    socket.on('register', (userId) => {
        users[userId] = socket.id;
        console.log(`User ${userId} registered with socket ID ${socket.id}`);
        console.log(users)
    });

    // Handle call initiation to a specific user
    socket.on('call_request', (data) => {
        const { callerId, receiverId, offer, callerName } = data;
        const callerSocketId = users[receiverId];
        const receiverSocketId = users[receiverId];
        // console.log('receiverId', receiverSocketId)
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('incoming_call', { callerId, offer, callerName });
        } else {
            if(callerSocketId){
                io.to(receiverSocketId).emit('User_Not_Found',  {data:'User Not Found'});
            }
            console.log(`User ${receiverId} not found`);
            socket.emit('call_failed', { message: 'User not found' });
        }
    });

    // Handle call acceptance
    socket.on('accept_call', (data) => {
        const { callerId, answer } = data;
        const callerSocketId = users[callerId];
        if (callerSocketId) {
            io.to(callerSocketId).emit('call_accepted', { answer });
        }
    });

    // Handle call decline
    socket.on('decline_call', (data) => {
        const { callerId } = data;
        console.log('callerId', callerId)
        const callerSocketId = users[callerId];
        if (callerSocketId) {
            io.to(callerSocketId).emit('call_declined');
        }
    });

    // Handle ICE candidates
    socket.on('ice_candidate', (data) => {
        const { to, candidate } = data;
        const toSocketId = users[to];
        if (toSocketId) {
            io.to(toSocketId).emit('ice_candidate', { candidate });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove user from the users object
        for (const [userId, socketId] of Object.entries(users)) {
            if (socketId === socket.id) {
                delete users[userId];
                console.log(`User ${userId} disconnected`);
                break;
            }
        }
    });
});

server.listen(3000, () => {
    console.log('Signaling server running on port 3000');
});