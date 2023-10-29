import express from 'express'
import { GetChat, GetPrivateChats, SendMsg } from '../controllers/chats'

const router = express.Router()

router.get('/chat/getChat/:chatId',GetChat)
router.post('/chat/message/send/:chatId/:userId',SendMsg)
router.get('/chat/getprivate/:userId',GetPrivateChats)
export default router