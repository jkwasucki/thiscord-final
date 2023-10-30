import express from 'express'
import { 
    RegisterUser,
    LoginUser, 
    InviteFriend,
    AcceptInvite,
    GetFriends, 
    RemoveFriend, 
    SendResetViaEmail, 
    VerifyToken, 
    ChangePassword, 
    GetInvites, 
    DeclineInvite, 
    RefetchUser, 
    GetFriend, 
    SearchFriends, 
    ChangeUserAvatar, 
    ChangeUserNickname, 
    GetRandFriends, 
    DeleteNotification, 
    FindUser,
    SearchUsers,
    UpdateStatus
 } from '../controllers/user'

const router = express.Router()

//Authentication

router.post('/register',RegisterUser)
router.post('/login',LoginUser)
router.get('/refetch/:userId',RefetchUser)
router.post('/password/reset',SendResetViaEmail)
router.post('/password/change-password/:userId',ChangePassword)
router.get('/resetpass/verifyToken',VerifyToken)
router.post('/changeavatar/:userId',ChangeUserAvatar)
router.post('/changenickname/:userId',ChangeUserNickname)
router.post('/updateStatus/:userId/:status',UpdateStatus)
//Friends

//-invites
router.post('/invite/:fromId/:toId',InviteFriend)
router.post('/invite/accept/:userId/:senderId/:notificationId',AcceptInvite)
router.post('/invite/decline/:userId/:notificationId',DeclineInvite)

//-searches
router.get('/find/:identifier',FindUser)
router.get('/search/:nickname',SearchUsers)
router.get('/find/friend/:userId/:identifier',SearchFriends)

//-getters
router.get('/friends/getOne/:friendId',GetFriend)
router.get('/friends/getAll/:userId',GetFriends)
router.get('/invites/getAll/:userId',GetInvites)
router.get('/friends/getRandom/:userId',GetRandFriends)

router.delete('/friends/removeFriend/:userId/:friendId',RemoveFriend)
router.delete('/notification/delete/:senderId/:recieverId/:notificationId',DeleteNotification)
export default router