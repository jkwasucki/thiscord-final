
import { ObjectId } from "mongodb";
import mongoose, { Schema } from "mongoose";


const permissionsSchema = new Schema({
    owner:String,
    vips:[ObjectId],
    admins:[ObjectId]
})

const serverSchema = new Schema({
    owner:{
        type:String
    },
    permissions:{
        type:permissionsSchema
    },
    name:{
        type:String,
        require:true
    },
    avatar:{
        type:String,
        default:""
    },
    isPublic:{
        type:Boolean
    },
    channels:[{
        _id:ObjectId,
        chanType:String,
        title:String,
        rooms:[{
            _id:ObjectId,
            name:String,
        }]
    }],
    users:{
        type:Array,
        default:Array
    }
})

const ServerModel = mongoose.models.servers || mongoose.model('servers',serverSchema)

export default ServerModel
