import { ObjectId } from "mongodb";
import mongoose, { Schema } from "mongoose";
import types from '../../types'



const notificationSchema = new Schema({
    _id: ObjectId,
    text: String,
    type: String,
    payload:{
        triggeredById: String,
        triggeredByNickname:String,
        serverId:String
    }
})

const userSchema = new Schema<types.User>({
    email:{
        type:String,
        require:true
    },
    password:{
        type:String,
        require:true
    },
    nickname:{
        type:String,
    },
    avatar:{
        type:String
    },
    tag:{
        type:Number
    },
    friends:[{
        _id:ObjectId,
        chatId:ObjectId
    }],
    servers:{
        type:[String]
    },
    status:{
        type:String
    },
    notifications:[notificationSchema]
})

const UserModel = mongoose.models.users || mongoose.model('users',userSchema)

export default UserModel

