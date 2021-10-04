"use strict";

const { DB_URI, SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");
const bcrypt = require("bcrypt");
const { BadRequestError } = require("../expressError");
const db = require("../db");


/** User of the site. */

class User {


  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    // taking parameters, adding them to the db
    // hash password 
    // confirm the username is available
    // check if phone is available

    const hash_password = bcrypt.hash(password, BCRYPT_WORK_FACTOR)

    try {
      const result = await db.query(
        `INSERT INTO users (username,
                                password,
                                first_name,
                                last_name,
                                phone, 
                                join_at)
            VALUES
              ($1, $2, $3, $4, $5, current_timestamp)
            RETURNING username, password, first_name, last_name, phone`,
        [username, hash_password, first_name, last_name, phone]);
    } catch (err) {
      console.log(err)
      throw (new BadRequestError)
    }
    console.log("RESULT=",result);
    return result.rows[0]
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    // get username from database, returning hashed password 
    // hash given password, compare hashed to hashed  
    //const { username, password } = req.body;
    // 
    const result = await db.query(
      `SELECT password
         FROM users
         WHERE username = $1`,
      [username]);
    const user = result.rows[0];


    return Boolean(user) && (await bcrypt.compare(password, user.password) === true);

    // throw new UnauthorizedError("Invalid user/password");


  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    try {
      await db.query(
        `UPDATE users
        SET last_login_at=current_timestamp,
        WHERE username = $1`,
        [username]);
    } catch (err) {
      throw (new BadRequestError);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name
        FROM users;`
    )
    const users = result.rows;
    return users;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    try {
      const result = await db.query(
        `SELECT { 
          username,
          first_name,
          last_name,
          phone,
          join_at,
          last_login_at }
        FROM users
        WHERE username = $1`,
        [username]
      );
    }

    catch (err) {
      throw (new BadRequestError);
    }

    const user = result.rows[0];
    return user;
  }


  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {

    try {
      const mResult = await db.query(
        `
      SELECT id, to_user as toUser, body, sent_at, read_at
      FROM messages
      WHERE from_username = $1
      `, [username]
      );
    } 
    
    catch (err) {
      throw (new BadRequestError);
    }

    let messages = mResult.rows;

    // messages = [{id: 1, to_user: {username: lizzy, first_name: Lizzy, last_name: ..., phone: }, body: "hello", sent_at: date, read_at: other_date},...]

    // Loop over messages
    // Query users table
    // replace value of messages[i].to_user with user object
    for (let message of messages) {
      const uResult = await db.query(
        `
        SELECT username, first_name, last_name, phone
        FROM users
        WHERE username = $1
        `, [message.to_user]
      )
      const user = uResult.rows[0];
      
      message.to_user = user;
    }

    return messages;
  };


  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    try {
      const mResult = await db.query(
        `
      SELECT id, to_user as toUser, body, sent_at, read_at
      FROM messages
      WHERE to_username = $1
      `, [username]
      );
    } 
    
    catch (err) {
      throw (new BadRequestError);
    }

    let messages = mResult.rows;

    // messages = [{id: 1, to_user: {username: lizzy, first_name: Lizzy, last_name: ..., phone: }, body: "hello", sent_at: date, read_at: other_date},...]

    // Loop over messages
    // Query users table
    // replace value of messages[i].to_user with user object
    for (let message of messages) {
      const uResult = await db.query(
        `
        SELECT username, first_name, last_name, phone
        FROM users
        WHERE username = $1
        `, [message.from_user]
      )
      const user = uResult.rows[0];
      
      message.to_user = user;
    }

    return messages;
  };
}


module.exports = User;
