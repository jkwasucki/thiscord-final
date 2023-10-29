"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const servers_1 = require("../controllers/servers");
const router = express_1.default.Router();
router.get('/getall/:userId', servers_1.GetAllServers);
//Server
router.post('/server/create', servers_1.CreateChannelServer);
router.get('/server/getServer', servers_1.GetServer);
router.post('/server/changename/:serverId', servers_1.ChangeServerName);
router.post('/server/delete/:serverId', servers_1.DeleteServer);
router.post('/server/changeprivacy/:serverId', servers_1.ChangePrivacy);
router.post('/server/changeAvatar/:serverId', servers_1.ChangeServerAvatar);
router.post('/server/join/:serverId/:userId', servers_1.JoinServer);
router.post('/server/invite/:serverId/:fromId/:toId', servers_1.SendServerInvite);
router.post('/server/manageRole/:serverId', servers_1.ManageRole);
router.post('/server/removeusers/:serverId', servers_1.RemoveUsers);
router.get('/server/checkrole/:serverId/:userId', servers_1.CheckRole);
//Server channels
router.post('/server/channel/create/:serverId', servers_1.CreateChannel);
router.post('/server/channel/changename/:serverId/:channelId', servers_1.ChangeChannelName);
router.post('/server/channel/delete/:serverId/:channelId', servers_1.DeleteChannel);
exports.default = router;
