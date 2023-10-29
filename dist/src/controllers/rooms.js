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
exports.DeleteRoom = exports.ChangeRoomName = exports.CreateRoom = void 0;
const ChannelServer_1 = __importDefault(require("../models/ChannelServer"));
const mongodb_1 = require("mongodb");
const Chat_1 = __importDefault(require("../models/Chat"));
const CreateRoom = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { serverId, channelId } = req.params;
    const channelObjectId = new mongodb_1.ObjectId(channelId);
    const roomName = req.body.roomName;
    try {
        const server = yield ChannelServer_1.default.findById(serverId);
        const targetChannelIndex = server.channels.findIndex((channel) => channel._id.equals(channelObjectId));
        const newRoom = {
            _id: new mongodb_1.ObjectId(),
            name: roomName
        };
        const targetChannel = server.channels[targetChannelIndex];
        targetChannel.rooms.push(newRoom);
        const newChat = yield Chat_1.default.create({
            _id: newRoom._id,
            name: newRoom.name,
            type: "server"
            //default => 
            //messages:[]
            //pinned:{}
        });
        yield server.save();
        return res.status(200).json(newChat._id);
    }
    catch (error) {
        return res.status(200).json(error);
    }
});
exports.CreateRoom = CreateRoom;
const ChangeRoomName = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { serverId, channelId, roomId } = req.params;
    const newName = req.body.newName;
    try {
        const server = yield ChannelServer_1.default.findById(serverId);
        const channelIndex = server.channels.findIndex((channel) => channel._id.toString() === channelId);
        const channel = server.channels[channelIndex];
        const roomIndex = channel.rooms.findIndex((room) => room._id.toString() === roomId);
        const room = channel.rooms[roomIndex];
        room.name = newName;
        yield server.save();
        return res.status(200).json("Room name has been changed.");
    }
    catch (error) {
        return res.status(500).json("Something went wrong while CHANGE ROOM NAME");
    }
});
exports.ChangeRoomName = ChangeRoomName;
const DeleteRoom = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { serverId, channelId, roomId } = req.params;
    try {
        const server = yield ChannelServer_1.default.findById(serverId);
        const channelIndex = server.channels.findIndex((channel) => channel._id.toString() === channelId);
        const channel = server.channels[channelIndex];
        const roomIndex = channel.rooms.findIndex((room) => room._id.toString() === roomId);
        const { _id } = channel.rooms.splice(roomIndex, 1);
        yield Chat_1.default.findByIdAndDelete(_id);
        yield server.save();
        return res.status(200).json("Room has been deleted.");
    }
    catch (error) {
        return res.status(500).json("Something went wrong while DELETE ROOM");
    }
});
exports.DeleteRoom = DeleteRoom;
