import express from 'express'
import { ChangeRoomName, CreateRoom, DeleteRoom } from '../controllers/rooms'

const router = express.Router()

router.post('/room/create/:serverId/:channelId',CreateRoom)
router.post('/room/changename/:serverId/:channelId/:roomId',ChangeRoomName)
router.post('/room/delete/:serverId/:channelId/:roomId',DeleteRoom)
export default router
