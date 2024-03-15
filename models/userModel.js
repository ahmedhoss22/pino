// models/userModel.js
const bcrypt = require('bcrypt');
var db = require('../config/db')

class User {
  constructor({ id, email, password, role = 'admin', }) {
    this.email = email;
    this.password = password;
    this.role = role;
    this.id = id;
  }

  // Compare hashed password during login
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  static async findByEmail(email) {
    try {
      const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length > 0) {
        const userData = rows[0];
        return new User(userData);
      }
      return null; // No user found with the provided email
    } catch (error) {
      console.error(error);
      throw new Error('Error fetching user from the database');
    }
  }

  static async register({ email, password, role = 'admin' }) {
    try {
      // Hash the password before storing it
      const hashedPassword = await bcrypt.hash(password, 8);

      // Insert the new user into the database
      const [result] = await db.execute('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [
        email,
        hashedPassword,
        role,
      ]);

      // Return the newly created user
      const userId = result.insertId;
      return new User({ id: userId, email, password: hashedPassword, role });
    } catch (error) {
      console.error(error);
      throw new Error('Error registering user');
    }
  }
}

module.exports = User;
