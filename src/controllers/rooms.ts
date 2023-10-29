import { RequestHandler } from "express-serve-static-core";
import ServerModel from "../models/ChannelServer";
import { ObjectId } from "mongodb";
import ChatModel from "../models/Chat";

type Channel = {
    _id:ObjectId,
    title:string,
    rooms:Room[]
}

type Room = {
    _id:ObjectId
    name:string,
}


export const CreateRoom:RequestHandler = async(req,res,next)=>{
    const {serverId,channelId} = req.params
    const channelObjectId = new ObjectId(channelId)
    const roomName = req.body.roomName
    try {
        const server = await ServerModel.findById(serverId)
        const targetChannelIndex = server.channels.findIndex((channel:Channel)=>channel._id.equals(channelObjectId))
        
        const newRoom = {
            _id:new ObjectId(),
            name:roomName
        }
        const targetChannel = server.channels[targetChannelIndex]
     
        targetChannel.rooms.push(newRoom);

        const newChat = await ChatModel.create({
            _id:newRoom._id,
            name:newRoom.name,
            type:"server"
            //default => 
            //messages:[]
            //pinned:{}
        })   
     
        await server.save()
        return res.status(200).json(newChat._id)
    } catch (error) {
     return res.status(200).json(error)   
    }
}

export const ChangeRoomName:RequestHandler = async(req,res,next)=>{
    const {serverId,channelId,roomId} = req.params
    const newName = req.body.newName
    try {
        const server = await ServerModel.findById(serverId)
        const channelIndex = server.channels.findIndex((channel:Channel)=>channel._id.toString() === channelId)
        const channel = server.channels[channelIndex]
        const roomIndex = channel.rooms.findIndex((room:Room)=>room._id.toString() === roomId)
        const room = channel.rooms[roomIndex]

        room.name = newName
        await server.save()
        return res.status(200).json("Room name has been changed.")
    } catch (error) {
        return res.status(500).json("Something went wrong while CHANGE ROOM NAME")
    }
}

export const DeleteRoom:RequestHandler = async(req,res,next)=>{
    const {serverId,channelId,roomId} = req.params
    try {
        const server = await ServerModel.findById(serverId)
        
        const channelIndex = server.channels.findIndex((channel:Channel)=>channel._id.toString() === channelId)
        const channel = server.channels[channelIndex]
        const roomIndex = channel.rooms.findIndex((room:Room)=>room._id.toString() === roomId)
        
        const { _id } = channel.rooms.splice(roomIndex,1)

        await ChatModel.findByIdAndDelete(_id)
        await server.save()
        return res.status(200).json("Room has been deleted.")
    } catch (error) {
        return res.status(500).json("Something went wrong while DELETE ROOM")
    }
}