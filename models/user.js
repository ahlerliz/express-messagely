"use strict";

const { DB_URI, SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");
const bcrypt = require("bcrypt");
const { BadRequestError } = require("../expressError");
const db = require("../db");
const app = require("../app");

/** User of the site. */

class User {


  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  // make a quick query or try/catch 

  static async register({ username, password, first_name, last_name, phone }) {

    const hashPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)

    const uResult = await db.query(
      `SELECT username 
      FROM users
      WHERE username = $1`,
      [username]);

    const user = uResult.rows[0]
    // fail fast 
    if (!user) {
      const result = await db.query(
        `INSERT INTO users (username,
                                password,
                                first_name,
                                last_name,
                                phone, 
                                join_at,
                                last_login_at)
            VALUES
              ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
            RETURNING username, password, first_name, last_name, phone`,
        [username, hashPassword, first_name, last_name, phone]);
      return result.rows[0]
    }
    throw new BadRequestError();
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {

    const result = await db.query(
      `SELECT password
         FROM users
         WHERE username = $1`,
      [username]);
    const user = result.rows[0];

    return Boolean(user) && (await bcrypt.compare(password, user.password) === true);
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {

    const result = await db.query(
      `UPDATE users
        SET last_login_at = current_timestamp
        WHERE username = $1`,
      [username]);

    if (!result.rows[0]) throw new BadRequestError();
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

    const result = await db.query(
      `SELECT 
          username,
          first_name,
          last_name,
          phone,
          join_at,
          last_login_at
        FROM users
        WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];

    if (!user) throw new BadRequestError(); // throw 404

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

    // if user doesn't exist, throw error
    const mResult = await db.query(
      `
      SELECT id, to_username, body, sent_at, read_at
      FROM messages
      WHERE from_username = $1
      `, [username]
    );
    let messages = mResult.rows;

    //if (!mResult) throw new BadRequestError(); 

    for (let message of messages) {
      let uResult = await db.query(
        `
        SELECT username, first_name, last_name, phone
        FROM users
        WHERE username = $1
        `, [message.to_username]
      )
      const user = uResult.rows[0];
      message.to_user = user;
      delete message.to_username
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

    const mResult = await db.query(
      `
      SELECT id, from_username, body, sent_at, read_at
      FROM messages
      WHERE to_username = $1
      `, [username]
    );
    let messages = mResult.rows;

    if (!mResult) throw new BadRequestError();

    for (let message of messages) {
      let uResult = await db.query(
        `
        SELECT username, first_name, last_name, phone
        FROM users
        WHERE username = $1
        `, [message.from_username]
      )
      const user = uResult.rows[0];

      message.from_user = user;
      delete message.from_username
    }

    return messages;
  };
}


module.exports = User;
