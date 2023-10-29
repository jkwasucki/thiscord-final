import UserModel from "../models/User";
import ChatModel from "../models/Chat";
import { RequestHandler } from "express-serve-static-core";
import { ObjectId } from "mongodb";
import { parse, isAfter } from 'date-fns'

export const GetChat:RequestHandler = async(req,res,next) =>{
    const chatId = req.params.chatId
    try {
        const chat = await ChatModel.findById(chatId)
        return res.status(200).json(chat)
    } catch (error) {
        return res.status(500).json("Something went wrong while GET CHAT")
    }
}



export const SendMsg:RequestHandler = async(req,res,next)=>{
    const message = req.body.message
    const {chatId,userId} = req.params
   
    try {
        const chat = await ChatModel.findById(chatId)
        const user = await UserModel.findById(userId)
        const lastMessage = chat.messages.length > 0 ? chat.messages.slice(-1)[0] : null;
        const currentTime = new Date();
        const oneMinuteAgo = new Date(currentTime.getTime() - 60 * 1000); // 1 minute ago
    
        let lastMessageTimestamp: Date | undefined;
    
        if (lastMessage) {
          lastMessageTimestamp = parse(
            lastMessage.timestamp,
            'dd/MM/yyyy, HH:mm:ss',
            new Date()
          );
        }

        //If message was sent not longer than a minute ago, append it
        if (
          lastMessage &&
          lastMessageTimestamp !== undefined && 
          lastMessage.sender === userId &&
          isAfter(lastMessageTimestamp, oneMinuteAgo)
        ) {

          const messageObject = {
            _id:new ObjectId(),
            text:message,
            type:"appended",
            sender:user._id,
            timestamp: new Date().toLocaleString('en-GB', { hour12: false })
          }
          chat.messages.push(messageObject)
          await chat.save()
          return res.status(200).json(messageObject)
        }else{
            const messageObject = {
              _id:new ObjectId(),
              type:"individual",
              text:message,
              sender:user._id,
              timestamp: new Date().toLocaleString('en-GB', { hour12: false })
            }
            chat.messages.push(messageObject)
            await chat.save()
            return res.status(200).json(messageObject)
        }
        
        
    } catch (error) {
    return res.status(500).json(error)   
    }
}


export const GetPrivateChats: RequestHandler = async (req, res, next) => {
    const userId = req.params.userId;
    try {
      const user = await UserModel.findById(userId);
      
      const chats = await Promise.all(
        user.friends.map(async (friend: { _id: ObjectId, chatId: ObjectId }) => {
          try {
            const frnd = await UserModel.findById(friend._id);
            const chat = await ChatModel.findById(friend.chatId);
            
            if (chat && chat.messages.length > 0) {
              const friendObject = {
                _id: frnd._id,
                avatar: frnd.avatar,
                nickname: frnd.nickname,
                email: frnd.email,
                chatId: friend.chatId,
              };
              
              return friendObject;
            }
          } catch (error) {
            console.error('Error fetching friend or chat:', error);
            // You might want to log the error or do something specific here
          }
        })
      );
  
      const filteredChats = chats.filter((chat) => chat !== undefined);
  
      return res.status(200).json(filteredChats);
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json("Something went wrong while GET PRIVATE CHATS");
    }
  };