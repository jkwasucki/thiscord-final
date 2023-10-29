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
exports.CreateChannel = exports.DeleteChannel = exports.ChangeChannelName = exports.RemoveUsers = exports.ManageRole = exports.SendServerInvite = exports.JoinServer = exports.CheckRole = exports.ChangeServerAvatar = exports.ChangePrivacy = exports.DeleteServer = exports.ChangeServerName = exports.GetAllServers = exports.GetServer = exports.CreateChannelServer = void 0;
const User_1 = __importDefault(require("../models/User"));
const mongodb_1 = require("mongodb");
const Chat_1 = __importDefault(require("../models/Chat"));
const ChannelServer_1 = __importDefault(require("../models/ChannelServer"));
const CreateChannelServer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.query.userId;
    const { avatar, name } = req.body;
    try {
        const user = yield User_1.default.findById(userId);
        const server = yield ChannelServer_1.default.create({
            _id: new mongodb_1.ObjectId(),
            permissions: {
                owner: user._id,
                vips: [],
                admins: []
            },
            name: name,
            avatar: avatar,
            isPublic: true,
            channels: [
                {
                    _id: new mongodb_1.ObjectId(),
                    title: 'Text channel',
                    chanType: 'text',
                    rooms: [
                        {
                            _id: new mongodb_1.ObjectId(),
                            name: 'general',
                        }
                    ]
                },
                {
                    _id: new mongodb_1.ObjectId(),
                    title: 'Voice channel',
                    chanType: 'voice',
                    rooms: [
                        {
                            _id: new mongodb_1.ObjectId(),
                            name: 'general',
                        }
                    ]
                }
            ],
            users: [Object.assign(Object.assign({}, user), { permission: 'owner' })]
        });
        const roomId = server.channels[0].rooms[0]._id;
        const chat = yield Chat_1.default.create({
            _id: roomId,
            type: 'server',
            messages: [],
            name: server.channels[0].rooms[0].name
        });
        user.servers.push(server._id);
        yield user.save();
        yield server.save();
        yield chat.save();
        return res.status(200).json({ serverId: server._id, chatId: chat._id });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json(error);
    }
});
exports.CreateChannelServer = CreateChannelServer;
const GetServer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const serverId = req.query.id;
    try {
        const serverData = yield ChannelServer_1.default.findById(serverId);
        return res.status(200).json(serverData);
    }
    catch (err) {
        return res.status(200).json("Something went wrong while GET SERVER");
    }
});
exports.GetServer = GetServer;
const GetAllServers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    try {
        const user = yield User_1.default.findById(userId);
        const userServerRefs = user.servers;
        const servers = yield Promise.all(userServerRefs.map((serverId) => __awaiter(void 0, void 0, void 0, function* () {
            const serverObjectId = new mongodb_1.ObjectId(serverId);
            try {
                const server = yield ChannelServer_1.default.findById(serverObjectId);
                if (!server) {
                    // If server not found, remove the invalid reference
                    user.servers = user.servers.filter((id) => id !== serverId);
                    yield user.save();
                    // Explicitly return a value indicating the absence of a server
                    return null;
                }
                const serverData = Object.assign(Object.assign({}, server), { _id: server._id, avatar: server.avatar, name: server.name, channels: server.channels });
                return serverData;
            }
            catch (error) {
                // Log the error, but don't r4i a response here
                console.error('Error fetching server:', error);
                // Explicitly return a value indicating the error
                return { error: 'Error fetching server' };
            }
        })));
        // Filter out null values (absence of server) and errors
        const validServers = servers.filter(server => server !== null && !server.error);
        if (validServers.length > 0) {
            return res.status(200).json(validServers);
        }
        else {
            return res.status(200).json([]);
        }
    }
    catch (error) {
        return res.status(500).json(error);
    }
});
exports.GetAllServers = GetAllServers;
const ChangeServerName = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const serverId = req.params.serverId;
    const newName = req.body.newName;
    try {
        const server = yield ChannelServer_1.default.findById(serverId);
        server.name = newName;
        yield server.save();
        return res.status(200).json("Server name has been changed.");
    }
    catch (error) {
        return res.status(200).json("Something went wrong while CHANGE NAME");
    }
});
exports.ChangeServerName = ChangeServerName;
const DeleteServer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const serverId = req.params.serverId;
    try {
        yield ChannelServer_1.default.findByIdAndDelete(serverId);
        return res.status(200).json("Server has been deleted");
    }
    catch (error) {
        return res.status(200).json("Something went wrong while CHANGE NAME");
    }
});
exports.DeleteServer = DeleteServer;
const ChangePrivacy = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const serverId = req.params.serverId;
    const boolean = req.body.boolean;
    try {
        const server = yield ChannelServer_1.default.findById(serverId);
        server.isPublic = boolean;
        yield server.save();
        return res.status(200).json(`Privacy changed to: Public - ${boolean}`);
    }
    catch (error) {
        return res.status(500).json("Something went wrong while CHANGE PRIVACY");
    }
});
exports.ChangePrivacy = ChangePrivacy;
const ChangeServerAvatar = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const serverId = req.params.serverId;
    const avatar = req.body.avatar;
    try {
        const server = yield ChannelServer_1.default.findById(serverId);
        server.avatar = avatar;
        yield server.save();
        return res.status(200).json("Avatar has been changed.");
    }
    catch (error) {
        return res.status(500).json("Something went wrong while CHANGE SERVER AVATAR");
    }
});
exports.ChangeServerAvatar = ChangeServerAvatar;
const CheckRole = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { serverId, userId } = req.params;
    try {
        const server = yield ChannelServer_1.default.findById(serverId);
        if (server.permissions.owner === userId) {
            return res.status(200).json({ owner: true });
        }
        else if (server.permissions.admins.includes(userId)) {
            return res.status(200).json({ admin: true });
        }
        else if (server.permissions.vips.includes(userId)) {
            return res.status(200).json({ vip: true });
        }
        else {
            return res.status(200).json("User is neutral");
        }
    }
    catch (error) {
        return res.status(500).json("Something went wrong while CHECK ROLE");
    }
});
exports.CheckRole = CheckRole;
const JoinServer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { serverId, userId } = req.params;
    try {
        const server = yield ChannelServer_1.default.findById(serverId);
        const user = yield User_1.default.findById(userId);
        const isUserMember = server.users.some((u) => u._id.toString() === userId);
        if (isUserMember) {
            return res.status(400).json("User is already a member of this server");
        }
        user.notifications = user.notifications.filter((notification) => notification.type === 'server-innv' && notification.payload.serverId !== serverId);
        user.servers.push(serverId);
        server.users.push(user);
        yield server.save();
        yield user.save();
        return res.status(200).json("Server joined");
    }
    catch (error) {
        return res.status(500).json(error);
    }
});
exports.JoinServer = JoinServer;
const SendServerInvite = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { serverId, fromId, toId } = req.params;
    try {
        const user = yield User_1.default.findById(fromId);
        const friend = yield User_1.default.findById(toId);
        const server = yield ChannelServer_1.default.findById(serverId);
        const alreadyNotified = friend.notifications.find((notification) => notification.payload.triggeredById === fromId);
        if (alreadyNotified) {
            return res.status(400).json("Invite has been already sent");
        }
        const alreadyMember = server.users.filter((user) => user._id.toString() === toId);
        if (alreadyMember.length > 0) {
            return res.status(400).json("Already a member");
        }
        friend.notifications.push({
            _id: new mongodb_1.ObjectId(),
            text: `${user.nickname} invites you to join ${server.name}!`,
            type: 'server-inv',
            payload: {
                triggeredById: user._id,
                serverId: serverId
            }
        });
        yield friend.save();
        return res.status(200).json("Invitation sent!");
    }
    catch (error) {
        return res.status(500).json("Something went wrong while SEND SERVER INVITE");
    }
});
exports.SendServerInvite = SendServerInvite;
const ManageRole = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const serverId = req.params.serverId;
    const role = req.body.role;
    const selectedUsers = req.body.selectedUsers;
    const action = req.body.action;
    if (!action || !role || selectedUsers.length === 0) {
        return res.status(404).json("Select a user and role");
    }
    try {
        const server = yield ChannelServer_1.default.findById(serverId);
        let errors = [];
        yield Promise.all(selectedUsers.map(({ name, _id }) => __awaiter(void 0, void 0, void 0, function* () {
            if (role === 'admin') {
                if (action === 'grant') {
                    if (server.permissions.admins.includes(_id)) {
                        errors.push(`User ${name} is already an admin`);
                    }
                    else {
                        server.permissions.admins.push(_id);
                        yield server.save();
                    }
                }
                else if (action === 'withdraw') {
                    if (!server.permissions.admins.includes(_id)) {
                        errors.push(`User ${name} is not an Admin`);
                    }
                    else {
                        server.permissions.admins = server.permissions.admins.filter((id) => id.toString() !== _id);
                        yield server.save();
                    }
                }
            }
            else if (role === 'vip') {
                if (action === 'grant') {
                    if (server.permissions.vips.includes(_id)) {
                        errors.push(`User ${name} is already a VIP`);
                    }
                    else {
                        server.permissions.vips.push(_id);
                        yield server.save();
                    }
                }
                else if (action === 'withdraw') {
                    if (!server.permissions.vips.includes(_id)) {
                        errors.push(`User ${name} is not a VIP`);
                    }
                    else {
                        server.permissions.vips = server.permissions.vips.filter((id) => id.toString() !== _id);
                        yield server.save();
                    }
                }
            }
        })));
        if (errors.length > 0) {
            return res.status(400).json(errors[0]);
        }
        else {
            return res.status(200).json("Roles updated");
        }
    }
    catch (err) {
        return res.status(500).json(err);
    }
});
exports.ManageRole = ManageRole;
const RemoveUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const serverId = req.params.serverId;
    const selectedUsers = req.body.selectedUsers;
    if (selectedUsers.length === 0) {
        return res.status(404).json("Select a user and role");
    }
    try {
        const server = yield ChannelServer_1.default.findById(serverId);
        yield Promise.all(selectedUsers.map(({ name, _id }) => __awaiter(void 0, void 0, void 0, function* () {
            const user = yield User_1.default.findById(_id);
            user.servers = user.servers.filter((id) => id !== serverId);
            yield user.save();
            server.users = server.users.filter((u) => u._id.toString() !== _id);
            yield server.save();
        })));
        return res.status(200).json("Users deleted");
    }
    catch (error) {
        return res.status(500).json(error);
    }
});
exports.RemoveUsers = RemoveUsers;
//Channels
const ChangeChannelName = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { serverId, channelId } = req.params;
    const newName = req.body.newName;
    try {
        const server = yield ChannelServer_1.default.findById(serverId);
        const channel = server.channels.find((channel) => channel._id.toString() === channelId);
        channel.title = newName;
        yield server.save();
        return res.status(200).json("Channel name changed.");
    }
    catch (error) {
        return res.status(500).json("Something went wrong while CHANGE CHANNEL NAME");
    }
});
exports.ChangeChannelName = ChangeChannelName;
const DeleteChannel = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { serverId, channelId } = req.params;
    try {
        const server = yield ChannelServer_1.default.findById(serverId);
        const channeIndex = server.channels.findIndex((channel) => channel._id.toString() === channelId);
        const spliced = server.channels.splice(channeIndex, 1);
        yield server.save();
        return res.status(200).json(spliced);
    }
    catch (error) {
        return res.status(500).json("Something went wrong while DELETE CHANNEL");
    }
});
exports.DeleteChannel = DeleteChannel;
const CreateChannel = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const serverId = req.params.serverId;
    const { channelName, type } = req.body;
    try {
        const server = yield ChannelServer_1.default.findById(serverId);
        if (type === 'text') {
            const newChannel = {
                _id: new mongodb_1.ObjectId(),
                type: 'text',
                title: channelName,
                rooms: [
                    {
                        _id: new mongodb_1.ObjectId(),
                        name: 'general',
                    }
                ]
            };
            server.channels.push(newChannel);
            const roomId = newChannel.rooms[0]._id;
            const chat = yield Chat_1.default.create({
                _id: roomId,
                type: "server",
                messages: [],
                name: newChannel.rooms[0].name
            });
            yield server.save();
            yield chat.save();
            return res.status(200).json("Channel has been created.");
        }
        else if (type === 'voice') {
            const newChannel = {
                _id: new mongodb_1.ObjectId(),
                type: 'voice',
                title: channelName,
                rooms: [
                    {
                        _id: new mongodb_1.ObjectId(),
                        name: 'general',
                    }
                ]
            };
            server.channels.push(newChannel);
            yield server.save();
            return res.status(200).json("Channel has been created.");
        }
    }
    catch (error) {
        return res.status(500).json("Something went wrong while CREATE CHANNEL");
    }
});
exports.CreateChannel = CreateChannel;
