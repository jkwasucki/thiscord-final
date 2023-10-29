import { RequestHandler } from "express-serve-static-core";
import UserModel from "../models/User";
import { ObjectId } from "mongodb";
import ChatModel from "../models/Chat";
import ServerModel from "../models/ChannelServer";
import types from '../../types'


export const CreateChannelServer:RequestHandler = async(req,res,next) => {
    const userId = req.query.userId
    const {avatar, name} = req.body
    try {
        const user = await UserModel.findById(userId)
        const server = await ServerModel.create({
            _id:new ObjectId(),
            permissions:{
                owner:user._id,
                vips:[],
                admins:[]
            },
            name:name,
            avatar:avatar,
            isPublic:true,
            channels:[
                {
                    _id: new ObjectId(),
                    title:'Text channel',
                    chanType:'text',
                    rooms:[
                        {
                            _id:new ObjectId(),
                            name:'general',
                        }
                    ]
                },
                {
                    _id: new ObjectId(),
                    title:'Voice channel',
                    chanType:'voice',
                    rooms:[
                        {
                            _id:new ObjectId(),
                            name:'general',
                        }
                    ]
                }
            ],
            users:[{...user,permission:'owner'}]
        })

        const roomId = server.channels[0].rooms[0]._id
        const chat = await ChatModel.create({
            _id: roomId,
            type:'server',
            messages: [],
            name:server.channels[0].rooms[0].name
        });

       
        user.servers.push(server._id)
        
        await user.save()
        await server.save()
        await chat.save()
        return res.status(200).json({serverId: server._id, chatId:chat._id})
    } catch (error) {
        console.error(error)
        return res.status(500).json(error)
    }
}

export const GetServer:RequestHandler = async(req,res,next) =>{
    const serverId = req.query.id
    try{
        const serverData = await ServerModel.findById(serverId)
        return res.status(200).json(serverData)
    }catch(err){
        return res.status(200).json("Something went wrong while GET SERVER")
    }
}

export const GetAllServers: RequestHandler = async (req, res, next) => {
    const userId = req.params.userId;

    try {
        const user = await UserModel.findById(userId);
        const userServerRefs = user.servers;

        const servers = await Promise.all(
            userServerRefs.map(async (serverId: string) => {
                const serverObjectId = new ObjectId(serverId);
                try {
                    const server = await ServerModel.findById(serverObjectId);

                    if (!server) {
                        // If server not found, remove the invalid reference
                        user.servers = user.servers.filter((id: string) => id !== serverId);
                        await user.save();
                        // Explicitly return a value indicating the absence of a server
                        return null;
                    }

                    const serverData = {
                        ...server,
                        _id: server._id,
                        avatar: server.avatar,
                        name: server.name,
                        channels: server.channels,
                    };
                    return serverData;
                } catch (error) {
                    // Log the error, but don't r4i a response here
                    console.error('Error fetching server:', error);
                    // Explicitly return a value indicating the error
                    return { error: 'Error fetching server' };
                }
            })
        );

        // Filter out null values (absence of server) and errors
        const validServers = servers.filter(server => server !== null && !server.error);

        if (validServers.length > 0) {
            return res.status(200).json(validServers);
        } else {
            return res.status(200).json([]);
        }
    } catch (error) {
        return res.status(500).json(error);
    }
};

export const ChangeServerName:RequestHandler = async(req,res,next)=>{
    const serverId = req.params.serverId
    const newName = req.body.newName
    try {
        const server = await ServerModel.findById(serverId)
        server.name = newName
        await server.save()
        return res.status(200).json("Server name has been changed.")
    } catch (error) {
        return res.status(200).json("Something went wrong while CHANGE NAME")
    }
}

export const DeleteServer:RequestHandler = async(req,res,next)=>{
    const serverId = req.params.serverId
    try {
        await ServerModel.findByIdAndDelete(serverId)

        return res.status(200).json("Server has been deleted")
    } catch (error) {
        return res.status(200).json("Something went wrong while CHANGE NAME")
    }
}

export const ChangePrivacy:RequestHandler = async(req,res,next)=>{
    const serverId = req.params.serverId
    const boolean = req.body.boolean
    try {
        const server = await ServerModel.findById(serverId)
        server.isPublic = boolean
        await server.save()
        return res.status(200).json(`Privacy changed to: Public - ${boolean}`)
    } catch (error) {
        return res.status(500).json("Something went wrong while CHANGE PRIVACY")
    }
}

export const ChangeServerAvatar:RequestHandler = async(req,res,next)=>{
    const serverId = req.params.serverId
    const avatar = req.body.avatar
    try {
        const server = await ServerModel.findById(serverId)
        server.avatar = avatar
        await server.save()
        return res.status(200).json("Avatar has been changed.")
    } catch (error) {
        return res.status(500).json("Something went wrong while CHANGE SERVER AVATAR")
    }
}

export const CheckRole:RequestHandler = async(req,res,next)=>{
    const {serverId,userId} = req.params
    try {
       
        const server = await ServerModel.findById(serverId)

        if(server.permissions.owner === userId){
            return res.status(200).json({owner:true})
        }else if(server.permissions.admins.includes(userId)){
            return res.status(200).json({admin:true})
        }else if(server.permissions.vips.includes(userId)){
            return res.status(200).json({vip:true})
        }else{
            return res.status(200).json("User is neutral")
        }
    } catch (error) {
        return res.status(500).json("Something went wrong while CHECK ROLE")
    }
}

export const JoinServer:RequestHandler = async(req,res,next)=>{
    const {serverId,userId} = req.params


    try {
        const server = await ServerModel.findById(serverId)
        const user = await UserModel.findById(userId)
        

        const isUserMember = server.users.some((u:types.User) => u._id.toString() === userId);

        if (isUserMember) {
            return res.status(400).json("User is already a member of this server");
        }

        user.notifications = user.notifications.filter((notification:types.Notifications)=>notification.type === 'server-innv' && notification.payload.serverId !== serverId)

        user.servers.push(serverId)
        server.users.push(user);
        await server.save()
        await user.save()
        return res.status(200).json("Server joined")
    } catch (error) {
        return res.status(500).json(error)
    }
}

export const SendServerInvite:RequestHandler = async(req,res,next)=>{
    const {serverId,fromId,toId} = req.params
    try {
        const user = await UserModel.findById(fromId)
        const friend = await UserModel.findById(toId)
        const server = await ServerModel.findById(serverId)
        const alreadyNotified = friend.notifications.find((notification:types.Notifications)=>notification.payload.triggeredById === fromId )
        
        if(alreadyNotified){
            return res.status(400).json("Invite has been already sent")
        }

        const alreadyMember = server.users.filter((user:types.User)=>user._id.toString() === toId )
        if (alreadyMember.length > 0) {
            return res.status(400).json("Already a member")
        }
        friend.notifications.push({
            _id:new ObjectId(),
            text:`${user.nickname} invites you to join ${server.name}!`,
            type:'server-inv',
            payload:{
                triggeredById:user._id,
                serverId:serverId
            }
        })
        await friend.save()
        return res.status(200).json("Invitation sent!")
    } catch (error) {
        return res.status(500).json("Something went wrong while SEND SERVER INVITE")
    }
}

interface SelectedUsers {
    _id:string,
    name:string
}

export const ManageRole:RequestHandler = async(req,res,next)=>{
    const serverId = req.params.serverId
    const role = req.body.role
    const selectedUsers:SelectedUsers[] = req.body.selectedUsers
    const action = req.body.action

    if(!action || !role || selectedUsers.length === 0){
        return res.status(404).json("Select a user and role")
    }
    try{
        const server = await ServerModel.findById(serverId)
        let errors:string[] = []

        await Promise.all(
            selectedUsers.map(async({name,_id}:{name:string,_id:string})=>{
                if(role === 'admin'){
                    if(action === 'grant'){
                        if(server.permissions.admins.includes(_id)){
                            errors.push(`User ${name} is already an admin`);
                        }else{
                            server.permissions.admins.push(_id)
                            await server.save() 
                        }
                    }else if(action === 'withdraw'){
                        if(!server.permissions.admins.includes(_id)){
                            errors.push(`User ${name} is not an Admin`);
                        }else{
                            server.permissions.admins = server.permissions.admins.filter((id:string)=>id.toString() !== _id)
                            await server.save() 
                        }
                    }
                }else if(role === 'vip'){
                    if (action === 'grant'){
                        if(server.permissions.vips.includes(_id)){
                            errors.push(`User ${name} is already a VIP`);
                        }else{
                            server.permissions.vips.push(_id)
                            await server.save() 
                        }
                    }else if(action === 'withdraw'){
                        if(!server.permissions.vips.includes(_id)){
                            errors.push(`User ${name} is not a VIP`);
                        }else{
                            server.permissions.vips = server.permissions.vips.filter((id:string)=>id.toString() !== _id)
                            await server.save() 
                        }
                    }
                   
                }
            })
        )
        if (errors.length > 0) {
            return res.status(400).json(errors[0]);
        } else {
            return res.status(200).json("Roles updated");
        }   
    }catch(err){
        return res.status(500).json(err)
    }
}

export const RemoveUsers:RequestHandler = async(req,res,next)=>{
    const serverId = req.params.serverId
    const selectedUsers:SelectedUsers[] = req.body.selectedUsers
    if(selectedUsers.length === 0){
        return res.status(404).json("Select a user and role")
    }
    try {
        const server = await ServerModel.findById(serverId)
        await Promise.all(
          selectedUsers.map(async({name,_id}:{name:string,_id:string})=>{
            const user = await UserModel.findById(_id)
            user.servers = user.servers.filter((id:string)=>id !== serverId)
            await user.save()
            server.users = server.users.filter((u:types.User)=>u._id.toString() !== _id)
            await server.save()
          })
        )
        return res.status(200).json("Users deleted")
    } catch (error) {
        return res.status(500).json(error)
    }
}


//Channels
export const ChangeChannelName:RequestHandler = async(req,res,next) =>{
    const {serverId,channelId} = req.params
    const newName = req.body.newName
    try {
        const server = await ServerModel.findById(serverId)
        const channel = server.channels.find((channel:types.Channel)=>channel._id.toString() === channelId)
        channel.title = newName
        await server.save()
        return res.status(200).json("Channel name changed.")
    } catch (error) {
        return res.status(500).json("Something went wrong while CHANGE CHANNEL NAME")
    }
}

export const DeleteChannel:RequestHandler = async(req,res,next) => {
    const {serverId,channelId} = req.params
    try {
        const server = await ServerModel.findById(serverId)
        const channeIndex = server.channels.findIndex((channel:types.Channel)=>channel._id.toString() === channelId)
        const spliced = server.channels.splice(channeIndex,1)
        await server.save()
        return res.status(200).json(spliced)
    } catch (error) {
        return res.status(500).json("Something went wrong while DELETE CHANNEL")
    }
}

export const CreateChannel:RequestHandler = async(req,res,next)=>{
    const serverId = req.params.serverId
    const {channelName,type} = req.body
    try {
        const server = await ServerModel.findById(serverId)
        
        if(type === 'text'){
            const newChannel = {
                _id:new ObjectId(),
                type:'text',
                title:channelName,
                rooms:[
                    {
                        _id:new ObjectId(),
                        name:'general',
                    }
                ]
            }
    
            server.channels.push(newChannel)
    
            const roomId = newChannel.rooms[0]._id
            const chat = await ChatModel.create({
                _id: roomId,
                type:"server",
                messages: [],
                name:newChannel.rooms[0].name
            });
            await server.save()
            await chat.save()
            return res.status(200).json("Channel has been created.")
        }else if(type === 'voice'){
            const newChannel = {
                _id:new ObjectId(),
                type:'voice',
                title:channelName,
                rooms:[
                    {
                        _id:new ObjectId(),
                        name:'general',
                    }
                ]
            }
    
            server.channels.push(newChannel)
            await server.save()
            return res.status(200).json("Channel has been created.")
        }
        
    } catch (error) {
        return res.status(500).json("Something went wrong while CREATE CHANNEL")
    }
}