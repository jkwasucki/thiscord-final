"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rooms_1 = require("../controllers/rooms");
const router = express_1.default.Router();
router.post('/room/create/:serverId/:channelId', rooms_1.CreateRoom);
router.post('/room/changename/:serverId/:channelId/:roomId', rooms_1.ChangeRoomName);
router.post('/room/delete/:serverId/:channelId/:roomId', rooms_1.DeleteRoom);
exports.default = router;
