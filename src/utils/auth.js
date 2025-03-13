import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // `bcryptjs` is better for Node.js than `bcrypt`

// Compare a plain password with a hashed password
export const comparePassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};

// Hash password before storing in DB
export const hashPassword = async (password) => {
    return bcrypt.hash(password, 10);
};

// Generate JWT token for authentication
export const createJWT = (user) => {
    return jwt.sign(
        {
            id: user._id, // Keep `id` instead of `_id` for consistency
            role: user.role, // Ensure role is included
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
};

// Verify JWT token
export const verifyJWT = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};
