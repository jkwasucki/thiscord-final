"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_1 = require("../controllers/user");
const router = express_1.default.Router();
//Authentication
router.post('/register', user_1.RegisterUser);
router.post('/login', user_1.LoginUser);
router.get('/refetch/:userId', user_1.RefetchUser);
router.post('/password/reset', user_1.SendResetViaEmail);
router.post('/password/change-password/:userId', user_1.ChangePassword);
router.get('/resetpass/verifyToken', user_1.VerifyToken);
router.post('/changeavatar/:userId', user_1.ChangeUserAvatar);
router.post('/changenickname/:userId', user_1.ChangeUserNickname);
router.post('/updateStatus/:userId/:status', user_1.UpdateStatus);
//Friends
//-invites
router.post('/invite/:fromId/:toId', user_1.InviteFriend);
router.post('/invite/accept/:userId/:senderId/:notificationId', user_1.AcceptInvite);
router.post('/invite/decline/:userId/:notificationId', user_1.DeclineInvite);
//-searches
router.get('/find/:identifier', user_1.FindUser);
router.get('/search/:nickname', user_1.SearchUsers);
router.get('/find/friend/:userId/:identifier', user_1.SearchFriends);
//-getters
router.get('/friends/getOne/:friendId', user_1.GetFriend);
router.get('/friends/getAll/:userId', user_1.GetFriends);
router.get('/invites/getAll/:userId', user_1.GetInvites);
router.get('/friends/getRandom/:userId', user_1.GetRandFriends);
router.delete('/friends/removeFriend/:userId/:friendId', user_1.RemoveFriend);
router.delete('/notification/delete/:senderId/:recieverId/:notificationId', user_1.DeleteNotification);
exports.default = router;
