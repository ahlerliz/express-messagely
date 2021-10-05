"use strict";


const jwt = require("jsonwebtoken");
const Router = require("express").Router;
const router = new Router();

const User = require("../models/user");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth")


/** GET / - get list of users.
 *  must be logged in user
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

router.get('/', ensureLoggedIn, async function (req, res, next) {
    const users = await User.all();
    return res.json({ users });
});


/** GET /:username - get detail of users.
 * user can only access their own 
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get('/:username', ensureLoggedIn, ensureCorrectUser, async function (req, res, next) {
    const { username } = req.params;
    console.log("username", username)
    const user = await User.get(username);
    console.log("user", user)
    return res.json({ user });
});


/** GET /:username/to - get messages to user
 * user can only access their own 
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/to', ensureLoggedIn, ensureCorrectUser, async function (req, res, next) {
    const { username } = req.params;
    const messages = await User.messagesTo(username);
    return res.json(messages);
});

/** GET /:username/from - get messages from user
 * user can only access their own 
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get('/:username/from', ensureLoggedIn, ensureCorrectUser, async function (req, res, next) {
    const { username } = req.params;
    const messages = await User.messagesFrom(username);
    return res.json(messages);
});

module.exports = router;