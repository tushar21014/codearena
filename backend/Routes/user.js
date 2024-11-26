const express = require('express');
const User = require('../Models/User');
const app = express();
const router = express.Router();
app.use(express.json());
const fetchuser = require('../middleware/fetchuser');

router.post('/addFriend', fetchuser, async (req, res) => {
    try {
        const { friendId } = req.body;
        const user = await User.findById(req.user);
        const friend = await User.findById(friendId);
        // console.log(user);
        if (!friend) {
            return res.status(404).json({ error: "Friend not found" });
        }
        if (user.friends.includes(friendId)) {
            return res.status(400).json({ error: "Friend already exists" });
        }

        user.friends.push(friendId);
        friend.friends.push(user._id);
        await user.save();
        await friend.save();
        res.json({ user, friend });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
);

router.delete('/removeFriend/:friendId', fetchuser, async (req, res) => {
    try {
        const { friendId } = req.params;
        const user = await User.findById(req.user);
        const friend = await User.findById(friendId);
        if (!friend) {
            return res.status(404).json({ error: "Friend not found" });
        }
        if (!user.friends.includes(friendId)) {
            return res.status(400).json({ error: "Friend does not exists" });
        }
        const index = user.friends.indexOf(friendId);
        user.friends.splice(index, 1);
        const index2 = friend.friends.indexOf(user._id);
        friend.friends.splice(index2, 1);
        await user.save();
        await friend.save();
        res.json({ user, friend });
        console.log("Friend Removed Successfully")
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
);

router.get('/getFriends', fetchuser, async (req, res) => {
    try {
        const user = await User.findById(req.user).populate('friends');
        res.json(user.friends);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}   
);

module.exports = router