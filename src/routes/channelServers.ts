import express from 'express'
import { ChangeChannelName, ChangePrivacy, ChangeServerAvatar, ChangeServerName, CheckRole, CreateChannel, CreateChannelServer, DeleteChannel, DeleteServer, GetAllServers, GetServer, JoinServer, ManageRole, RemoveUsers, SendServerInvite } from '../controllers/servers'

const router = express.Router()

router.get('/getall/:userId',GetAllServers)


//Server
router.post('/server/create',CreateChannelServer)
router.get('/server/getServer',GetServer)
router.post('/server/changename/:serverId',ChangeServerName)
router.post('/server/delete/:serverId',DeleteServer)
router.post('/server/changeprivacy/:serverId',ChangePrivacy)
router.post('/server/changeAvatar/:serverId',ChangeServerAvatar)
router.post('/server/join/:serverId/:userId',JoinServer)
router.post('/server/invite/:serverId/:fromId/:toId',SendServerInvite)
router.post('/server/manageRole/:serverId',ManageRole)
router.post('/server/removeusers/:serverId',RemoveUsers)
router.get('/server/checkrole/:serverId/:userId',CheckRole)
//Server channels
router.post('/server/channel/create/:serverId',CreateChannel)
router.post('/server/channel/changename/:serverId/:channelId',ChangeChannelName)
router.post('/server/channel/delete/:serverId/:channelId',DeleteChannel)
export default router