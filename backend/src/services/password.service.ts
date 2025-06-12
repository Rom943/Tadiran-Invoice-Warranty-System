import bcrypt from 'bcrypt';

export default {
  /**
   * Hash a password
   * @param password - Plain text password to hash
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  },

  /**
   * Compare a plain text password with a hashed password
   * @param plainPassword - Plain text password
   * @param hashedPassword - Hashed password to compare against
   * @returns Whether the passwords match
   */
  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
};
