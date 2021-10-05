"use strict";


const Router = require("express").Router;
const router = new Router();
const { BadRequestError } = require("../expressError");
const { SECRET_KEY } = require("../config");
const jwt = require("jsonwebtoken");
const User = require("../models/user");


/** POST /login: {username, password} => {token} */
 // Get the username and password from the json.body
 // Call User.authenticate using those credentials
 // If valid credentials, we create and return a token

 router.post('/login', async function(req,res,next) {
    const { username, password } = req.body;

    const valid_credentials = await User.authenticate(username, password);

    if (valid_credentials) {
        let token = jwt.sign({ username }, SECRET_KEY);

        return res.json({ token });
      }
    throw new BadRequestError("Invalid user/password");
  });

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post('/register',async function(req,res,next){
    const {
        username,
        password,
        first_name,
        last_name, 
        phone
    } = req.body;

    const userInfo = {
        username,
        password,
        first_name,
        last_name, 
        phone
    }

    const user = await User.register(userInfo);

    let token = jwt.sign({ username }, SECRET_KEY);
    
    return res.json({ token });
});

module.exports = router;