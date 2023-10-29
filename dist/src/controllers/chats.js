"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPrivateChats = exports.SendMsg = exports.GetChat = void 0;
const User_1 = __importDefault(require("../models/User"));
const Chat_1 = __importDefault(require("../models/Chat"));
const mongodb_1 = require("mongodb");
const date_fns_1 = require("date-fns");
const GetChat = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const chatId = req.params.chatId;
    try {
        const chat = yield Chat_1.default.findById(chatId);
        return res.status(200).json(chat);
    }
    catch (error) {
        return res.status(500).json("Something went wrong while GET CHAT");
    }
});
exports.GetChat = GetChat;
const SendMsg = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const message = req.body.message;
    const { chatId, userId } = req.params;
    try {
        const chat = yield Chat_1.default.findById(chatId);
        const user = yield User_1.default.findById(userId);
        const lastMessage = chat.messages.length > 0 ? chat.messages.slice(-1)[0] : null;
        const currentTime = new Date();
        const oneMinuteAgo = new Date(currentTime.getTime() - 60 * 1000); // 1 minute ago
        let lastMessageTimestamp;
        if (lastMessage) {
            lastMessageTimestamp = (0, date_fns_1.parse)(lastMessage.timestamp, 'dd/MM/yyyy, HH:mm:ss', new Date());
        }
        //If message was sent not longer than a minute ago, append it
        if (lastMessage &&
            lastMessageTimestamp !== undefined &&
            lastMessage.sender === userId &&
            (0, date_fns_1.isAfter)(lastMessageTimestamp, oneMinuteAgo)) {
            const messageObject = {
                _id: new mongodb_1.ObjectId(),
                text: message,
                type: "appended",
                sender: user._id,
                timestamp: new Date().toLocaleString('en-GB', { hour12: false })
            };
            chat.messages.push(messageObject);
            yield chat.save();
            return res.status(200).json(messageObject);
        }
        else {
            const messageObject = {
                _id: new mongodb_1.ObjectId(),
                type: "individual",
                text: message,
                sender: user._id,
                timestamp: new Date().toLocaleString('en-GB', { hour12: false })
            };
            chat.messages.push(messageObject);
            yield chat.save();
            return res.status(200).json(messageObject);
        }
    }
    catch (error) {
        return res.status(500).json(error);
    }
});
exports.SendMsg = SendMsg;
const GetPrivateChats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    try {
        const user = yield User_1.default.findById(userId);
        const chats = yield Promise.all(user.friends.map((friend) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const frnd = yield User_1.default.findById(friend._id);
                const chat = yield Chat_1.default.findById(friend.chatId);
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
            }
            catch (error) {
                console.error('Error fetching friend or chat:', error);
                // You might want to log the error or do something specific here
            }
        })));
        const filteredChats = chats.filter((chat) => chat !== undefined);
        return res.status(200).json(filteredChats);
    }
    catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json("Something went wrong while GET PRIVATE CHATS");
    }
});
exports.GetPrivateChats = GetPrivateChats;
