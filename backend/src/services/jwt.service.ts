import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import config from '../config/env.config';
import { JwtPayload } from '../types';

export default {
  /**
   * Generate a JWT token for a user
   * @param userId - User ID
   * @param userType - Type of user (installer or admin)
   * @param email - User email
   * @returns JWT token
   */
  generateToken(userId: string, userType: 'installer' | 'admin', email: string): string {
    const payload: JwtPayload = {
      userId,
      userType,
      email
    };
    
    // Use a type assertion to tell TypeScript this is a valid secret
    return jwt.sign(
      payload, 
      config.jwt.secret as Secret, 
      { expiresIn: config.jwt.expiresIn } as SignOptions
    );
  },

  /**
   * Verify a JWT token
   * @param token - JWT token to verify
   * @returns Decoded token payload or null if invalid
   */
  verifyToken(token: string): JwtPayload | null {
    try {
      // Also use type assertion here for consistency
      const decoded = jwt.verify(token, config.jwt.secret as Secret) as JwtPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }
};
