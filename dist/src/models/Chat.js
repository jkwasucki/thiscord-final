"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const mongoose_1 = __importStar(require("mongoose"));
const messageSchama = new mongoose_1.Schema({
    _id: mongodb_1.ObjectId,
    text: String,
    type: String,
    sender: {
        type: String
    },
    timestamp: {
        type: String
    }
});
const chatSchema = new mongoose_1.Schema({
    name: {
        type: String
    },
    type: {
        type: String
    },
    messages: [messageSchama],
    pinned: {
        _id: mongodb_1.ObjectId,
        text: String,
        sender: {
            type: String,
        }
    },
}, {
    timestamps: true
});
const ChatModel = mongoose_1.default.models.chats || mongoose_1.default.model('chats', chatSchema);
exports.default = ChatModel;
