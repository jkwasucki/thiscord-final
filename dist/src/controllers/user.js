"use strict";
//TODO: Increase reset password/email token security
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
exports.SearchUsers = exports.FindUser = exports.SearchFriends = exports.RemoveFriend = exports.GetFriend = exports.GetRandFriends = exports.GetFriends = exports.AcceptInvite = exports.InviteFriend = exports.DeclineInvite = exports.GetInvites = exports.DeleteNotification = exports.UpdateStatus = exports.ChangeUserNickname = exports.ChangeUserAvatar = exports.ChangePassword = exports.VerifyToken = exports.SendResetViaEmail = exports.RefetchUser = exports.LoginUser = exports.RegisterUser = void 0;
const User_1 = __importDefault(require("../models/User"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bson_1 = require("bson");
const nodemailer_1 = __importDefault(require("nodemailer"));
const googleapis_1 = require("googleapis");
const Chat_1 = __importDefault(require("../models/Chat"));
//User 
const RegisterUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userExists = yield User_1.default.findOne({ email: req.body.email });
        if (userExists) {
            return res.status(400).json("User already exists.");
        }
        if (req.body.password.length < 5) {
            return res.status(400).json("Password must be atleast 5 characters.");
        }
        yield User_1.default.create({
            email: req.body.email,
            password: bcrypt_1.default.hashSync(req.body.password, 10),
            tag: Math.floor(10000 + Math.random() * 90000),
            avatar: 'default',
            nickname: req.body.email.split('@').shift(),
            status: {
                online: false,
                away: false,
                offline: false
            }
        });
        res.status(200).json("Registered succesfully.");
    }
    catch (error) {
        res.status(500).json("Something went wrong while processing REGISTER");
    }
});
exports.RegisterUser = RegisterUser;
const LoginUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json("Provide both email and password.");
        }
        //check if user exists
        const user = yield User_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json("User not found.");
        }
        //validate password
        const isValid = yield bcrypt_1.default.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json("Invalid password.");
        }
        //create cookie data        
        const tokenData = {
            _id: user._id,
            password: user.password
        };
        //encrypt cookie
        const token = jsonwebtoken_1.default.sign(tokenData, process.env.JWT_SIGN_TOKEN, { expiresIn: '8h', algorithm: 'HS512' });
        const expirationTime = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
        res.cookie("token", token, {
            expires: new Date(Date.now() + expirationTime),
            httpOnly: false,
            path: '/'
        });
        yield user.save();
        return res.status(200).json(user);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json(error);
    }
});
exports.LoginUser = LoginUser;
const RefetchUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    try {
        const user = yield User_1.default.findById(userId);
        return res.status(200).json(user);
    }
    catch (error) {
        return res.status(500).json("Something went wrong while REFETCH USER");
    }
});
exports.RefetchUser = RefetchUser;
const SendResetViaEmail = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const email = req.body.email;
    try {
        const userExists = yield User_1.default.findOne({ email: email });
        if (!userExists) {
            return res.status(404).json("Couldn't find associated account.");
        }
        //Generate resetToken transfered via link.
        const tokenData = {
            _id: userExists._id,
            email: userExists.email
        };
        const resetToken = jsonwebtoken_1.default.sign(tokenData, process.env.JWT_SIGN_TOKEN, { expiresIn: '24h', algorithm: 'HS256' });
        const OAuth2 = googleapis_1.google.auth.OAuth2;
        const oauth2Client = new OAuth2(process.env.OAUTH_CLIENTID, process.env.OAUTH_CLIENT_SECRET, "https://developers.google.com/oauthplayground" // Redirect URL
        );
        oauth2Client.setCredentials({
            refresh_token: process.env.OAUTH_REFRESH_TOKEN
        });
        const accessToken = oauth2Client.getAccessToken();
        let transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: 'jkwasucki99@gmail.com',
                clientId: process.env.OAUTH_CLIENTID,
                clientSecret: process.env.OAUTH_CLIENT_SECRET,
                refreshToken: process.env.OAUTH_REFRESH_TOKEN,
                accessToken: accessToken,
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        const mailOptions = {
            from: "jkwasucki99@gmail.com",
            to: req.body.email,
            subject: "Your password reset link is here",
            generateTextFromHTML: true,
            html: `<p>Click on the following link to reset your password:</p>
           <a href="http://localhost:3000/resetpass?tkn=${resetToken}">Reset Password</a>`
        };
        transporter.sendMail(mailOptions, (error, response) => {
            error ? console.log(error) : console.log(response);
            transporter.close();
        });
        return res.status(200).json("Verification email sent!");
    }
    catch (error) {
        res.status(500).json(error);
    }
});
exports.SendResetViaEmail = SendResetViaEmail;
const VerifyToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.query.tkn;
    try {
        if (!token) {
            // Handle the case where the token is undefined (not provided)
            return res.status(400).json({ error: 'Token is not provided' });
        }
        try {
            console.log(token);
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SIGN_TOKEN, { algorithms: ['HS256'] });
            return res.status(200).json(decoded);
        }
        catch (error) {
            console.log(error);
            return res.status(400).json("Token expired.");
        }
    }
    catch (error) {
    }
});
exports.VerifyToken = VerifyToken;
const ChangePassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    try {
        const user = yield User_1.default.findById(userId);
        if (req.body.password.length < 5) {
            return res.status(400).json("Password must be atleast 5 characters.");
        }
        const newPassword = req.body.password;
        const hashedPassword = bcrypt_1.default.hashSync(newPassword, 10);
        user.password = hashedPassword;
        user.save();
        return res.status(200).json("Password changed succesfully!");
    }
    catch (error) {
        return res.status(500).json("Something went wrong while PASSWORD CHANGE");
    }
});
exports.ChangePassword = ChangePassword;
const ChangeUserAvatar = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    const avatarUrl = req.body.avatar;
    try {
        const user = yield User_1.default.findById(userId);
        user.avatar = avatarUrl;
        yield user.save();
        return res.status(200).json("Avatar changed.");
    }
    catch (error) {
        return res.status(500).json("Something went wrong while CHANGE USER AVATAR");
    }
});
exports.ChangeUserAvatar = ChangeUserAvatar;
const ChangeUserNickname = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    const nickname = req.body.nickname;
    try {
        const user = yield User_1.default.findById(userId);
        user.nickname = nickname;
        yield user.save();
        return res.status(200).json("Nickname changed.");
    }
    catch (error) {
        return res.status(500).json("Something went wrong while CHANGE USER NICKNAME");
    }
});
exports.ChangeUserNickname = ChangeUserNickname;
const UpdateStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, status } = req.params;
    try {
        const user = yield User_1.default.findById(userId);
        user.status = status;
        yield user.save();
        return res.status(200).json("User status changed");
    }
    catch (error) {
        return res.status(500).json("Something went wrong while STATUS CHANGE");
    }
});
exports.UpdateStatus = UpdateStatus;
const DeleteNotification = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { senderId, recieverId, notificationId } = req.params;
    try {
        const sender = yield User_1.default.findById(senderId);
        const reciever = yield User_1.default.findById(recieverId);
        sender.notifications = sender.notifications.filter((notification) => notification._id.toString() !== notificationId);
        reciever.notifications = reciever.notifications.filter((notification) => notification._id.toString() !== notificationId);
        yield sender.save();
        yield reciever.save();
        return res.status(200).json("Notification removed");
    }
    catch (error) {
        return res.status(500).json("Something went wrong while DELETE NOTIFICATION");
    }
});
exports.DeleteNotification = DeleteNotification;
//Friends
const GetInvites = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    try {
        const user = yield User_1.default.findById(userId);
        return res.status(200).json(user.notifications);
    }
    catch (error) {
        return res.status(500).json("something went wrong while GET NOTIFICATIONS");
    }
});
exports.GetInvites = GetInvites;
const DeclineInvite = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { notificationId, userId } = req.params;
    try {
        const user = yield User_1.default.findById(userId);
        user.notifications = user.notifications.filter((notification) => notification._id.toString() !== notificationId);
        yield user.save();
        return res.status(200).json("Invite declined.");
    }
    catch (error) {
        return res.status(500).json("Something went wrong while DECLINE INVITE");
    }
});
exports.DeclineInvite = DeclineInvite;
const InviteFriend = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { fromId, toId } = req.params;
    try {
        const user = yield User_1.default.findById(fromId);
        const friend = yield User_1.default.findById(toId);
        if (!friend) {
            return res.status(404).json("User not found.");
        }
        const alreadyNotified = friend.notifications.find((notification) => notification.payload.triggeredById === fromId);
        if (alreadyNotified) {
            return res.status(400).json("Friend request has been already sent");
        }
        const alreadyFriend = user.friends.filter((user) => user._id.toString() === toId);
        if (alreadyFriend.length > 0) {
            return res.status(400).json("Already a friend");
        }
        friend.notifications.push({
            _id: new bson_1.ObjectId(),
            text: `${user.nickname} wants to be your friend!`,
            type: 'friend-inv',
            payload: {
                triggeredById: user._id,
                triggeredByNickname: user.nickname
            }
        });
        friend.markModified('notifications');
        yield friend.save();
        return res.status(200).json("Invitation sent!");
    }
    catch (error) {
        return res.status(500).json("Something went wrong while INVITING TO FRIENDS");
    }
});
exports.InviteFriend = InviteFriend;
const AcceptInvite = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, senderId, notificationId } = req.params;
    try {
        const reciever = yield User_1.default.findById(userId);
        const sender = yield User_1.default.findById(senderId);
        if (senderId === userId) {
            return res.status(400).json("You cant invite yourself");
        }
        const session = yield User_1.default.startSession();
        try {
            yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
                //Shared chat id
                const chatId = new bson_1.ObjectId();
                reciever.friends.push({
                    _id: new bson_1.ObjectId(sender._id),
                    chatId: chatId
                });
                //Remove notification
                reciever.notifications = reciever.notifications.filter((notifi) => notifi._id.toString() !== notificationId);
                yield reciever.save();
                sender.friends.push({
                    _id: new bson_1.ObjectId(reciever._id),
                    chatId: chatId
                });
                yield sender.save();
                session.endSession();
                yield Chat_1.default.create({
                    _id: chatId,
                    type: 'private',
                    messages: [],
                });
            }));
            return res.status(200).json("Friend has been added.");
        }
        catch (error) {
            console.log(error);
            return res.status(500).json(error);
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json("Something went wrong while ACCEPTING INVITE");
    }
});
exports.AcceptInvite = AcceptInvite;
const GetFriends = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    try {
        const user = yield User_1.default.findById(userId);
        const friends = yield Promise.all(user.friends.map((friend) => __awaiter(void 0, void 0, void 0, function* () {
            const friendData = yield User_1.default.findById(friend._id);
            const friendObject = {
                _id: friendData._id,
                avatar: friendData.avatar,
                nickname: friendData.nickname,
                email: friendData.email,
                chatId: friend.chatId
            };
            return friendObject;
        })));
        return res.status(200).json(friends);
    }
    catch (error) {
        return res.status(500).json(error);
    }
});
exports.GetFriends = GetFriends;
const GetRandFriends = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    try {
        const user = yield User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json('User not found');
        }
        const allFriends = user.friends;
        if (allFriends.length === 0) {
            return res.status(200).json([]);
        }
        const shuffledFriends = allFriends.sort(() => Math.random() - 0.5);
        // Return 1 friend if there are less than 2, 2 friends if there are less than 3, otherwise return 3 friends
        const numFriendsToReturn = Math.min(3, Math.max(2, allFriends.length));
        const randomFriendsIds = shuffledFriends.slice(0, numFriendsToReturn);
        let randomFriends = yield Promise.all(randomFriendsIds.map((id) => __awaiter(void 0, void 0, void 0, function* () {
            const friend = yield User_1.default.findById(id);
            return friend;
        })));
        return res.status(200).json(randomFriends);
    }
    catch (error) {
        return res.status(500).json('Internal Server Error');
    }
});
exports.GetRandFriends = GetRandFriends;
const GetFriend = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const friendId = req.params.friendId;
    try {
        const friend = yield User_1.default.findById(friendId);
        return res.status(200).json(friend);
    }
    catch (error) {
        return res.status(200).json("Something went wrong while GET FRIEND");
    }
});
exports.GetFriend = GetFriend;
const RemoveFriend = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, friendId } = req.params;
    try {
        const user = yield User_1.default.findById(userId);
        const friend = yield User_1.default.findById(friendId);
        const session = yield User_1.default.startSession();
        try {
            yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
                user.friends = user.friends.filter((friend) => friend._id.toString() !== friendId);
                yield user.save();
                friend.friends = friend.friends.filter((friend) => friend._id.toString() !== userId);
                yield friend.save();
                session.endSession();
            }));
        }
        catch (error) {
            return res.status(400).json("Something went wrong");
        }
        return res.status(200).json("Friend removed.");
    }
    catch (error) {
        return res.status(200).json("Something went wrong while REMOVING FRIEND");
    }
});
exports.RemoveFriend = RemoveFriend;
const SearchFriends = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, identifier } = req.params;
    try {
        const user = yield User_1.default.findById(userId);
        const friends = yield Promise.all(user.friends.map((friend) => __awaiter(void 0, void 0, void 0, function* () {
            const user = yield User_1.default.findById(friend._id);
            if (user.nickname.toLowerCase().includes(identifier.toLowerCase())) {
                const userObject = {
                    _id: user._id,
                    avatar: user.avatar,
                    nickname: user.nickname,
                    email: user.email,
                    chatId: friend.chatId
                };
                return userObject;
            }
        })));
        if (!friends) {
            return res.status(404).json("Friend not found");
        }
        const filteredFriends = friends.filter((friend) => friend !== undefined);
        if (filteredFriends.length === 0) {
            return res.status(404).json("Friend not found");
        }
        return res.status(200).json(filteredFriends);
    }
    catch (error) {
        return res.status(500).json("Something went wrong while SEARCH FRIENDS");
    }
});
exports.SearchFriends = SearchFriends;
//Users
const FindUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const identifier = req.params.identifier;
    try {
        const users = yield User_1.default.findById(identifier);
        if (!users) {
            return res.status(404).json("User(s) not found");
        }
        return res.status(200).json(users);
    }
    catch (error) {
        return res.status(500).json("Something went wrong while FIND USER");
    }
});
exports.FindUser = FindUser;
const SearchUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const nickname = req.params.nickname;
    try {
        const users = yield User_1.default.find({ nickname: nickname });
        if (!users) {
            return res.status(404).json("User(s) not found");
        }
        return res.status(200).json(users);
    }
    catch (error) {
        return res.status(500).json("Something went wrong while SEARCH USERS");
    }
});
exports.SearchUsers = SearchUsers;
