"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
exports.default = {
    /**
     * Hash a password
     * @param password - Plain text password to hash
     * @returns Hashed password
     */
    async hashPassword(password) {
        const salt = await bcrypt_1.default.genSalt(10);
        const hash = await bcrypt_1.default.hash(password, salt);
        return hash;
    },
    /**
     * Compare a plain text password with a hashed password
     * @param plainPassword - Plain text password
     * @param hashedPassword - Hashed password to compare against
     * @returns Whether the passwords match
     */
    async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt_1.default.compare(plainPassword, hashedPassword);
    }
};
