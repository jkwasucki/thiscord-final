"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chats_1 = require("../controllers/chats");
const router = express_1.default.Router();
router.get('/chat/getChat/:chatId', chats_1.GetChat);
router.post('/chat/message/send/:chatId/:userId', chats_1.SendMsg);
router.get('/chat/getprivate/:userId', chats_1.GetPrivateChats);
exports.default = router;
