//TODO: Increase reset password/email token security

import { RequestHandler } from "express";
import UserModel from "../models/User";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { ObjectId } from "bson";
import nodemailer from 'nodemailer'
import {google} from 'googleapis'
import types from '../../types'
import ChatModel from "../models/Chat";


//User 
export const RegisterUser:RequestHandler = async(req,res,next) =>{
    try {
        const userExists = await UserModel.findOne({email:req.body.email})

        if(userExists){
           return res.status(400).json("User already exists.")
        }

        if(req.body.password.length < 5){
           return res.status(400).json("Password must be atleast 5 characters.")
        } 

        await UserModel.create({
            email:req.body.email,
            password:bcrypt.hashSync(req.body.password, 10), 
            tag:Math.floor(10000 + Math.random() * 90000),
            avatar:'default',
            nickname:req.body.email.split('@').shift(),
            status:{
                online:false,
                away:false,
                offline:false
            }
        })

        res.status(200).json("Registered succesfully.")

    } catch (error) {
        res.status(500).json("Something went wrong while processing REGISTER")
    }
}

export const LoginUser:RequestHandler = async(req,res,next) =>{
    try{
        const {email,password} = req.body
    
        if(!email || !password){
            return res.status(400).json("Provide both email and password.")
        }
        //check if user exists
        const user = await UserModel.findOne({email})
        if(!user){
            return res.status(400).json("User not found.")
        }

        //validate password
        const isValid = await bcrypt.compare(password, user.password);
        if(!isValid){
            return res.status(400).json("Invalid password.")
        }

        //create cookie data        
        const tokenData = {
            _id:user._id,
            password:user.password
        }
    
        //encrypt cookie
        const token =  jwt.sign(tokenData,process.env.JWT_SIGN_TOKEN!,{expiresIn:'8h',algorithm: 'HS512'})

        const expirationTime = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
        res.cookie("token", token, {
            expires: new Date(Date.now() + expirationTime),
            secure: true, 
            sameSite: 'none', 
            domain: '.thiscord-backend-vycpo.ondigitalocean.app/', 
        })
       
        await user.save()
        return res.status(200).json(user);
        
    }catch(error){
        console.error(error)
        return res.status(500).json(error)
    }
}

export const RefetchUser:RequestHandler = async(req,res,next)=>{
    const userId = req.params.userId
    try {
        const user = await UserModel.findById(userId)
        return res.status(200).json(user)        
    } catch (error) {
        return res.status(500).json("Something went wrong while REFETCH USER")
    }
}

export const SendResetViaEmail:RequestHandler = async(req,res,next) =>{
    const email = req.body.email
    try {
        const userExists = await UserModel.findOne({email:email})
        if(!userExists){
            return res.status(404).json("Couldn't find associated account.")
        }

        //Generate resetToken transfered via link.
        const tokenData = {
            _id:userExists._id,
            email:userExists.email
        }

        const resetToken = jwt.sign(tokenData, process.env.JWT_SIGN_TOKEN!, { expiresIn: '24h', algorithm: 'HS256' });
  


        const OAuth2 = google.auth.OAuth2
        const oauth2Client = new OAuth2(
        process.env.OAUTH_CLIENTID,
        process.env.OAUTH_CLIENT_SECRET, 
            "https://developers.google.com/oauthplayground" // Redirect URL
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.OAUTH_REFRESH_TOKEN
        });

        const accessToken = oauth2Client.getAccessToken()

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              type: 'OAuth2',
              user: 'jkwasucki99@gmail.com', 
              clientId: process.env.OAUTH_CLIENTID,
              clientSecret: process.env.OAUTH_CLIENT_SECRET,
              refreshToken: process.env.OAUTH_REFRESH_TOKEN,
              accessToken: accessToken,
            },
            tls: {
                rejectUnauthorized: false
              }
          } as nodemailer.TransportOptions );


          const mailOptions = {
            from: "jkwasucki99@gmail.com",
            to: req.body.email,
            subject: "Your password reset link is here",
            generateTextFromHTML: true,
            html: `<p>Click on the following link to reset your password:</p>
           <a href="http://localhost:3000/resetpass?tkn=${resetToken}">Reset Password</a>`
        };

        transporter.sendMail(mailOptions, (error, response) => {
            error ? console.log(error) : console.log(response);
            transporter.close();
        }); 
        return res.status(200).json("Verification email sent!")
    } catch (error) {
        res.status(500).json(error)
    }
}

export const VerifyToken:RequestHandler = async(req,res,next)=>{
    const token = req.query.tkn as string | undefined
    
    try {
        if (!token) {
            // Handle the case where the token is undefined (not provided)
            return res.status(400).json({ error: 'Token is not provided' });
        }
        try {
            console.log(token)
            const decoded = jwt.verify(token, process.env.JWT_SIGN_TOKEN!, { algorithms: ['HS256'] });
            
            return res.status(200).json(decoded)
        } catch (error) {
            console.log(error)
            return res.status(400).json("Token expired.")
        }
    } catch (error) {
        
    }
}

export const ChangePassword:RequestHandler = async(req,res,next)=>{
    const userId = req.params.userId
    try {
        const user = await UserModel.findById(userId)
        if(req.body.password.length < 5){
            return res.status(400).json("Password must be atleast 5 characters.")
        }
        
        const newPassword = req.body.password

        const hashedPassword = bcrypt.hashSync(newPassword, 10)
        user.password = hashedPassword

        user.save()
        return res.status(200).json("Password changed succesfully!")
    } catch (error) {
        return res.status(500).json("Something went wrong while PASSWORD CHANGE")
    }
}

export const ChangeUserAvatar:RequestHandler = async(req,res,next)=>{
    const userId = req.params.userId
    const avatarUrl = req.body.avatar
    try {
        const user = await UserModel.findById(userId)
        user.avatar = avatarUrl    
        await user.save()
        return res.status(200).json("Avatar changed.")
    } catch (error) {
        return res.status(500).json("Something went wrong while CHANGE USER AVATAR")
    }
}

export const ChangeUserNickname:RequestHandler = async(req,res,next)=>{
    const userId = req.params.userId
    const nickname = req.body.nickname
    try {
        const user = await UserModel.findById(userId)
        user.nickname = nickname
        await user.save()
        return res.status(200).json("Nickname changed.")
    } catch (error) {
        return res.status(500).json("Something went wrong while CHANGE USER NICKNAME")
    }
}

export const UpdateStatus:RequestHandler = async(req,res,next)=>{
    const {userId,status} = req.params
    try {
        const user = await UserModel.findById(userId)
        user.status = status
        await user.save()
        return res.status(200).json("User status changed")
    } catch (error) {
        return res.status(500).json("Something went wrong while STATUS CHANGE")
    }
}

export const DeleteNotification:RequestHandler = async(req,res,next)=>{
    const {senderId,recieverId,notificationId} = req.params
    try {
        const sender = await UserModel.findById(senderId)
        const reciever = await UserModel.findById(recieverId)
        sender.notifications = sender.notifications.filter((notification:types.Notifications)=>notification._id.toString() !== notificationId)
        reciever.notifications = reciever.notifications.filter((notification:types.Notifications)=>notification._id.toString() !== notificationId)
        await sender.save()
        await reciever.save()
        return res.status(200).json("Notification removed")
    } catch (error) {
        return res.status(500).json("Something went wrong while DELETE NOTIFICATION")
    }
}


//Friends

export const GetInvites:RequestHandler = async(req,res,next)=>{
    const userId = req.params.userId
    try {
        const user = await UserModel.findById(userId)
        return res.status(200).json(user.notifications)
    } catch (error) {
        return res.status(500).json("something went wrong while GET NOTIFICATIONS")
    }
}

export const DeclineInvite:RequestHandler = async(req,res,next)=>{
    const {notificationId,userId} = req.params
    try {
        const user = await UserModel.findById(userId)
        user.notifications = user.notifications.filter((notification:types.Notifications)=>notification._id.toString() !== notificationId)
        await user.save()
        return res.status(200).json("Invite declined.")
    } catch (error) {
        return res.status(500).json("Something went wrong while DECLINE INVITE")
    }
}

export const InviteFriend:RequestHandler = async(req,res,next) =>{
    const {fromId,toId} = req.params
    try {
        const user = await UserModel.findById(fromId)
        const friend = await UserModel.findById(toId)

        if(!friend){
            return res.status(404).json("User not found.")
        }
        const alreadyNotified = friend.notifications.find((notification:types.Notifications)=>notification.payload.triggeredById === fromId )
        
        
        if(alreadyNotified){
            return res.status(400).json("Friend request has been already sent")
        }

        const alreadyFriend = user.friends.filter((user:types.User)=>user._id.toString() === toId )
        if (alreadyFriend.length > 0) {
            return res.status(400).json("Already a friend")
        }

        friend.notifications.push({
            _id:new ObjectId(),
            text:`${user.nickname} wants to be your friend!`,
            type:'friend-inv',
            payload:{
                triggeredById:user._id,
                triggeredByNickname:user.nickname
            }
        })

        friend.markModified('notifications')
        await friend.save()

        return res.status(200).json("Invitation sent!")
    } catch (error) {
        return res.status(500).json("Something went wrong while INVITING TO FRIENDS")
    }
}

export const AcceptInvite:RequestHandler = async(req,res,next) =>{
    const {userId,senderId, notificationId} =  req.params
    try {
        const reciever = await UserModel.findById(userId)
        const sender = await UserModel.findById(senderId)
        
        if(senderId === userId){
            return res.status(400).json("You cant invite yourself")
        }

        const session = await UserModel.startSession();
        try {
            await session.withTransaction(async () => {
            
                //Shared chat id
                const chatId = new ObjectId()

                reciever.friends.push({
                    _id: new ObjectId(sender._id),
                    chatId:chatId
                });
                    
                //Remove notification
                reciever.notifications = reciever.notifications.filter((notifi:types.Notifications)=>notifi._id.toString() !== notificationId)
                
                await reciever.save();

                sender.friends.push({
                    _id:new ObjectId(reciever._id),
                    chatId:chatId
                });

                await sender.save();
                session.endSession()

                await ChatModel.create({
                    _id: chatId,
                    type:'private',
                    messages: [],
                })
            });
            return res.status(200).json("Friend has been added.")
        } catch (error) {
            console.log(error)
            return res.status(500).json(error)
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json("Something went wrong while ACCEPTING INVITE")
    }
}

export const GetFriends:RequestHandler = async(req,res,next)=>{
    const userId = req.params.userId
    try {
        const user = await UserModel.findById(userId)

        const friends = await Promise.all(
            user.friends.map(async(friend:{_id:ObjectId,chatId:ObjectId})=>{
                const friendData = await UserModel.findById(friend._id)
                const friendObject = {
                    _id:friendData._id,
                    avatar:friendData.avatar,
                    nickname:friendData.nickname,
                    email:friendData.email,
                    chatId:friend.chatId
                }
                return friendObject
            })
        )

        return res.status(200).json(friends)
    } catch (error) {
        return res.status(500).json(error)
    }
}

export const GetRandFriends: RequestHandler = async (req, res, next) => {
    const userId = req.params.userId;
  
    try {
    
      const user = await UserModel.findById(userId);
  
      if (!user) {
        return res.status(404).json('User not found');
      }
  
      const allFriends = user.friends;
     
      if (allFriends.length === 0) {
        return res.status(200).json([]);
      }
  
      const shuffledFriends = allFriends.sort(() => Math.random() - 0.5);
  
      // Return 1 friend if there are less than 2, 2 friends if there are less than 3, otherwise return 3 friends
      const numFriendsToReturn = Math.min(3, Math.max(2, allFriends.length));
      const randomFriendsIds = shuffledFriends.slice(0, numFriendsToReturn);

      let randomFriends = await Promise.all(
        randomFriendsIds.map(async(id:ObjectId)=>{
            const friend = await UserModel.findById(id)
            return friend
        })
      )
  
      return res.status(200).json(randomFriends);
    } catch (error) {
      return res.status(500).json('Internal Server Error');
    }
  };

export const GetFriend:RequestHandler = async(req,res,next) => {
    const friendId = req.params.friendId
    try {
        const friend = await UserModel.findById(friendId)
        return res.status(200).json(friend)
    } catch (error) {
        return res.status(200).json("Something went wrong while GET FRIEND")
    }
}

export const RemoveFriend:RequestHandler = async(req,res,next)=>{
    const {userId,friendId} = req.params
    try {
        const user = await UserModel.findById(userId)
        const friend = await UserModel.findById(friendId)

        const session = await UserModel.startSession();
        try {
            await session.withTransaction(async ()=>{
                user.friends = user.friends.filter((friend:{_id:ObjectId,chatId:ObjectId})=>friend._id.toString() !== friendId)
                await user.save()

                friend.friends = friend.friends.filter((friend:{_id:ObjectId,chatId:ObjectId})=>friend._id.toString() !== userId)
                await friend.save()

                session.endSession()
            })
        } catch (error) {
            return res.status(400).json("Something went wrong")
        }
        return res.status(200).json("Friend removed.")
    } catch (error) {
        return res.status(200).json("Something went wrong while REMOVING FRIEND")
    }
}

export const SearchFriends:RequestHandler = async(req,res,next)=>{
    const { userId,identifier } = req.params
  
    try {
        const user = await UserModel.findById(userId)
        const friends = await Promise.all(
            user.friends.map(async(friend:{_id:ObjectId,chatId:ObjectId})=>{
                const user = await UserModel.findById(friend._id)
                if(user.nickname.toLowerCase().includes(identifier.toLowerCase())){
                    const userObject = {
                        _id:user._id,
                        avatar:user.avatar,
                        nickname:user.nickname,
                        email:user.email,
                        chatId:friend.chatId
                    }
                    return userObject
                }
            })
        )
        if(!friends){
            return res.status(404).json("Friend not found")
        }
        const filteredFriends = friends.filter((friend) => friend !== undefined);

        if (filteredFriends.length === 0) {
            return res.status(404).json("Friend not found");
        }

        return res.status(200).json(filteredFriends);
      
    } catch (error) {
        return res.status(500).json("Something went wrong while SEARCH FRIENDS")
    }
}

//Users

export const FindUser:RequestHandler = async(req,res,next)=>{
    const identifier = req.params.identifier
    try{
        const users = await UserModel.findById(identifier)
        if(!users){
            return res.status(404).json("User(s) not found")
        }
        return res.status(200).json(users)
    } catch (error) {
        return res.status(500).json("Something went wrong while FIND USER")
    }
}

export const SearchUsers:RequestHandler = async(req,res,next)=>{
    const nickname = req.params.nickname
    try {
        const users = await UserModel.find({nickname:nickname})
        if(!users){
            return res.status(404).json("User(s) not found")
        }
        return res.status(200).json(users)
    } catch (error) {
        return res.status(500).json("Something went wrong while SEARCH USERS")
    }
}