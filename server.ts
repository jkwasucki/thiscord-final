import mongoose from 'mongoose'
import express from 'express'
import userRouter from './src/routes/user'
import serverRouter from './src/routes/channelServers'
import chatRouter from './src/routes/chats'
import dotenv from 'dotenv'
import cors from 'cors'
import roomRouter from './src/routes/rooms'
import {Server, Socket} from 'socket.io'
import {createServer} from 'node:http'
import types from './types'

dotenv.config()

const MONGODB_URI:string | undefined = process.env.MONGODB_URI
const CLIENT_BASE_URL:string = process.env.NODE_ENV === 'production' ? 'https://thiscord-ten.vercel.app' : 'http://localhost:3000';

const app = express()
const corsOptions = {
    origin: CLIENT_BASE_URL,
    credentials: true,
};

app.use(cors(corsOptions));
const server = createServer(app);

const io = new Server(server, {
    cors: {
      origin: CLIENT_BASE_URL,
      methods:['GET','POST'],
      credentials: true
    },
    transports:['websocket'],
})
   



app.use(express.json())

app.use('/api/user',userRouter)
app.use('/api/servers',serverRouter)
app.use('/api/chats',chatRouter)
app.use('/api/rooms',roomRouter)


app.get('/', (req, res) => {
    res.send('hello from server');
});







//Where <string is userId
const userSockets:  Record<string, { socket: Socket, status: string }> = {}

const voiceRooms: Record<string, Record<string, 
{ users: 
    {
        _id: string; 
        avatar: string; 
        nickname: string, 
        micMuted:boolean,
        fullyMuted:boolean 
    }[] 
}>> = {};

io.on('connection', (socket) => {
    console.log("USER CONNECTED")
    socket.on("requestInitialActiveFriends",async(userFriends)=>{
        const socketInfoArray = await Promise.all(
            userFriends.map(async (friend:{_id:string,chatId:string}) => {
              if (userSockets[friend._id]) {
                return { userId: friend._id, status: userSockets[friend._id].status };
              }else return null
            })
          );
        const filteredSocketInfoArray = socketInfoArray.filter(info => info !== null);

        socket.emit('requestedInitialActiveFriends',filteredSocketInfoArray)
    })

    socket.on("requestInitialActiveServerUsers",async(serverParticipants)=>{
        const socketInfoArray = await Promise.all(
            serverParticipants.map(async (user:types.User) => {
              if (userSockets[user._id]) {
                return { userId: user._id, status: userSockets[user._id].status };
              }else return null
            })
          );
        const filteredSocketInfoArray = socketInfoArray.filter(info => info !== null);

        socket.emit('requestInitialServerUsers',filteredSocketInfoArray)
    })

    socket.on("join", (userId) => {
        // Associate the socket with the user ID and set status to true
        userSockets[userId] = { socket, status: 'active' };

       // Create an array of socket information
       const userSocketArray = Object.entries(userSockets).map(([socketUserId, { status }]) => ({
        userId: socketUserId,
        status,
    }));
      
        // Emit the array of socket information to the joining user
        io.emit('userSocketArray', userSocketArray);
        console.log(userSocketArray)

        io.emit('updateUsersSocket', { userId, status: 'active' });
    });

    socket.on('requestInitialUsersStatus',async()=>{
        const socketInfoArray = await Promise.all(
            Object.entries(userSockets).map(async ([userId, socketInfo]) => {
                return { userId, status: socketInfo.status };
            })
        )
        io.emit('requestedInitialUsersStatus',socketInfoArray)
    })
   

    socket.on('disconnect', () => {
       // Find the user ID associated with the disconnected socket
       const userId = Object.keys(userSockets).find(key => userSockets[key].socket === socket);

       // If the user ID is found, remove it from the object
       if (userId) {
            console.log("USER DISCONNECTED",userId)
           delete userSockets[userId];
           socket.emit('disconnectRoom',(userId))
           
           io.emit('disconnectedUser', userId);
           console.log('Updated Socket Array sent to clients:', Object.keys(userSockets));
        }
    });

    socket.on('inactive', (status) => {
        const userEntry = userSockets[status._id];

        // Check if the user entry exists in the socketObject
        if (userEntry) {
        const userId = status._id;
        // Update the status in the socketObject
        userSockets[status._id].status = 'inactive';
        io.emit('updateUsersSocket', { userId, status: 'inactive' });
        }
    });

    socket.on('active', (status) => {
        const userEntry = userSockets[status._id];

        // Check if the user entry exists in the socketObject
        if (userEntry) {
            const userId = status._id;
            // Update the status in the socketObject
            userEntry.status = 'active';
            io.emit('updateUsersSocket', { userId, status: 'active' });
        } else {
            console.error(`User entry not found for user ID: ${status._id}`);
        }
    });

    // VOICE CHANNELS
    socket.on('joinVoiceRoom', (user: { _id: string; avatar: string; nickname: string; micMuted:boolean, fullyMuted:boolean }, roomId: string, serverId: string) => {
        
        voiceRooms[serverId] = voiceRooms[serverId] || {};

        let voiceState = {
            micMuted: false,
            fullyMuted: false
        };

        for (const existingServerId in voiceRooms) {
            if (voiceRooms && voiceRooms[existingServerId]) {
                // Check if the user is already in any room across servers
                const isInAnyRoom = Object.values(voiceRooms[existingServerId]).some(room =>
                    room.users.some(existingUser => existingUser._id === user._id)
                );
    
                if (isInAnyRoom) {
                // User is already in a room in some server, remove them from that room
                for (const existingRoomId in voiceRooms[existingServerId]) {
                    if (voiceRooms[existingServerId].hasOwnProperty(existingRoomId)) {
                        const userIndex = voiceRooms[existingServerId][existingRoomId].users.findIndex(existingUser => existingUser._id === user._id);

                        if (userIndex !== -1) {
                            voiceState = {
                                micMuted:voiceRooms[existingServerId][existingRoomId].users[userIndex].micMuted,
                                fullyMuted:voiceRooms[existingServerId][existingRoomId].users[userIndex].fullyMuted
                            }
                            // Remove the user from the existing room
                            voiceRooms[existingServerId][existingRoomId].users.splice(userIndex, 1);
                            break
                        }
                    }
                }
            }
            }
        }

        if (voiceRooms[serverId][roomId]) {
            // Check if the user is not already in the room
            const userIndex = voiceRooms[serverId][roomId].users.findIndex(existingUser => existingUser._id === user._id);
    
            if (userIndex === -1) {
                // User is not in the room, add them with the stored voice state
                voiceRooms[serverId][roomId].users.push({
                    ...user,
                    micMuted: voiceState.micMuted,
                    fullyMuted: voiceState.fullyMuted
                });
            } else {
                // User is already in the room, do nothing
                return;
            }
        } else {
            // Room doesn't exist, create it and add the user
            voiceRooms[serverId][roomId] = { users: [user] };
        }
    
        // Emit the updated room information
        io.emit('displayRoom', voiceRooms[serverId][roomId])
    });

    socket.on('requestVoiceRooms',(serverId)=>{
        io.emit('requestedVoiceRooms',voiceRooms[serverId])
    })

    socket.on('disconnectRoom',(userId:string)=>{
        for (const existingServerId in voiceRooms) {
            if (voiceRooms.hasOwnProperty(existingServerId)) {
                // Check if the user is already in any room across servers
                const isInAnyRoom = Object.values(voiceRooms[existingServerId]).some(room =>
                    room.users.some(existingUser => existingUser._id === userId)
                );
    
                if (isInAnyRoom) {
                // User is already in a room in some server, remove them from that room
                for (const existingRoomId in voiceRooms[existingServerId]) {
                    if (voiceRooms[existingServerId].hasOwnProperty(existingRoomId)) {
                        const userIndex = voiceRooms[existingServerId][existingRoomId].users.findIndex(existingUser => existingUser._id === userId);

                        if (userIndex !== -1) {
                            // Remove the user from the existing room
                            voiceRooms[existingServerId][existingRoomId].users.splice(userIndex, 1);
                            break
                        }
                    }
                }
            }
            }
        }
    })

    socket.on('muteUnmuteClient',(userId:string)=>{
        // Find the user in voiceRooms and set micMuted to true
    for (const serverId in voiceRooms) {
        if (voiceRooms.hasOwnProperty(serverId)) {
            for (const roomId in voiceRooms[serverId]) {
                if (voiceRooms[serverId].hasOwnProperty(roomId)) {
                    const userIndex = voiceRooms[serverId][roomId].users.findIndex(existingUser => existingUser._id === userId);

                    if (userIndex !== -1) {
                        // Set micMuted to true for the found user
                        voiceRooms[serverId][roomId].users[userIndex].micMuted = !voiceRooms[serverId][roomId].users[userIndex].micMuted;
                        voiceRooms[serverId][roomId].users[userIndex].fullyMuted = false;

                    }
                }
            }
        }
    }
    })

    socket.on('fullyMuteUnmuteClient',(userId:string)=>{
        for (const serverId in voiceRooms) {
            if (voiceRooms.hasOwnProperty(serverId)) {
                for (const roomId in voiceRooms[serverId]) {
                    if (voiceRooms[serverId].hasOwnProperty(roomId)) {
                        const userIndex = voiceRooms[serverId][roomId].users.findIndex(existingUser => existingUser._id === userId);
    
                        if (userIndex !== -1) {
                            
                            if(voiceRooms[serverId][roomId].users[userIndex].fullyMuted === true){
                                voiceRooms[serverId][roomId].users[userIndex].fullyMuted = false
                                voiceRooms[serverId][roomId].users[userIndex].micMuted = true
                            }else{
                                voiceRooms[serverId][roomId].users[userIndex].fullyMuted = true
                                voiceRooms[serverId][roomId].users[userIndex].micMuted = true
                            }
                            break;
                        }
                    }
                }
            }
        }
    })

    socket.on('requestUserVoiceState',(userId:string)=>{
        for (const serverId in voiceRooms) {
            if (voiceRooms.hasOwnProperty(serverId)) {
                for (const roomId in voiceRooms[serverId]) {
                    if (voiceRooms[serverId].hasOwnProperty(roomId)) {
                        const userIndex = voiceRooms[serverId][roomId].users.findIndex(existingUser => existingUser._id === userId);
    
                        if (userIndex !== -1) {
                            io.emit('requestedUserVoiceState',voiceRooms[serverId][roomId].users[userIndex])
                            break;
                        }
                    }
                }
            }
        }
    })

    socket.on('chatMessage', (message) => {
        io.emit('chatMessage', message);
    });

});


const PORT = process.env.PORT || 4000;

if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI).then(() => {
        console.log("MongoDB connected.");
        server.listen(PORT, () => {
            console.log("Server running.");
        });

    });
} else {
    console.log("MONGODB_URI is ", MONGODB_URI);
}
