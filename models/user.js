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
    await db.query(
      `UPDATE users
        SET last_login_at=current_timestamp,
        WHERE username = $1`,
      [username])
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
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
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
  }
}


module.exports = User;
