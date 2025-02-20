const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins (for development)
    },
});

const users = {};
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id,users);

    socket.on('register', (userId) => {
        users[userId] = socket.id;
        console.log(`User ${userId} registered with socket ID ${socket.id}`);
        console.log(users)
    });
    // Handle signaling messages
    socket.on('offer', (data) => {
        // console.log('offer',data)
        const { offer, receiverId, callerId } = data;
        console.log('users',users)
        console.log('receivedId', receiverId, 'callerId', callerId)
        console.log('receiverId', receiverId)
        const callerSocketId = users[callerId];
        const receiverSocketId = users[receiverId];
        if (receiverSocketId){
            socket.broadcast.emit('offer', offer);
        }else{
            if (callerSocketId) {
                io.to(callerSocketId).emit('User_Not_Found', { data: 'User Not Found' });
            }
            console.log(`User ${receiverId} not found`);
            socket.emit('call_failed', { message: 'User not found' });
        }
        
    });

    socket.on('answer', (data) => {
        // console.log('anwser', data)
        socket.broadcast.emit('answer', data); 
    });
    socket.on('Call_Alert', (data) => {
        const { to,from,by } = data
        const AlertTo = users[to];
        if (AlertTo){
            io.to(AlertTo).emit('callAlert', { from: from,by:by });
        }else{
            socket.broadcast.emit('Online_Alert')
        }
       
    });
    socket.on('call_declined', () => {
        socket.broadcast.emit('call_declined'); 
    });

    socket.on('call_Rejected', () => {
        socket.broadcast.emit('call_Rejected');
    });

    socket.on('call_accepted', () => {
        socket.broadcast.emit('call_accepted'); 
    });

    socket.on('candidate', (data) => {
        // console.log('candidate', data)
        socket.broadcast.emit('candidate', data); 
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(3000, () => {
    console.log('Signaling server running on port 3000');
});