import { ObjectId } from "mongodb";
import mongoose, {Schema } from "mongoose";
import types from '../../types'

interface User {
    email:string,
    password:string
    nickname:string
    avatar:string
    tag:number
    friends:User[]
    servers:[]
    notifications:[
        {
            _id:ObjectId,
            text:string,
            type:string,
            triggeredBy:string
        }
    ]
}


interface Message {
    _id: ObjectId;
    type: string;
    text: string;
    sender: User;
    timestamp: string;
}

interface Chat  {
    _id:ObjectId,
    name?:string,
    type:string,
    messages:Message[],
    pinned?:Message
}

const messageSchama = new Schema({
    _id: ObjectId,
    text: String,
    type:String,
    sender:{
        type:String
    },
    timestamp:{
        type:String
    }
})

const chatSchema = new Schema<types.Chat>({
    name:{
        type:String
    },
    type:{
        type:String
    },
    messages: [messageSchama],
    pinned: {
        _id: ObjectId,
        text: String,
        sender:{
            type:String,
        }
    },
}, {
    timestamps: true
});

const ChatModel = mongoose.models.chats || mongoose.model('chats',chatSchema)

export default ChatModel

