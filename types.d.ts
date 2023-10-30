import { ObjectId } from "mongodb"

type resetToken ={
    email:string,
    exp:number,
    iat:number,
    _id:string
}

type User = {
    _id:string,
    email:string,
    password:string,
    nickname:string,
    avatar:string,
    tag:number,
    friends:User[],
     status:{
        online:Boolean,
        away:Boolean,
        offline:Boolean
    },
    status:string,
    servers:string[],
    notifications:Notification[],
}

type Notifications = {
    _id: ObjectId,
    text: string,
    type: string,
    payload:{
        triggeredById?:string,
        triggeredByNickname?:string,
        serverId?:string,
    }
}

type Chat = {
    _id:ObjectId,
    name?:string,
    type:string,
    messages:Message[],
    pinned?:Message
}

type Server = {
    _id:ObjectId,
    name:string,
    owner:string,
    avatar:string,
    channels:Channel[],
    users: User[]
}

type Channel = {
    _id:ObjectId,
    title:string,
    rooms:Room[]
}

type Room = {
    _id:ObjectId
    name:string,
}

type Message = {
    _id:ObjectId,
    type:string,
    text:string,
    sender:string,
}

type Friend = {
    _id: ObjectId,
    avatar: string,
    nickname: string,
    email: string,
    chatId: string
}