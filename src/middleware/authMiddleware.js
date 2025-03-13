import { verifyJWT } from "../utils/auth.js";
import User from "../models/User.js"; // Fixed incorrect import

// Middleware to protect routes for authenticated users
export const protect = async (req, res, next) => {
    try {
        const bearer = req.headers.authorization;
        if (!bearer || !bearer.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Authorization token missing or invalid" });
        }

        const token = bearer.split(" ")[1]; // Extract token
        const decodedToken = verifyJWT(token);
        if (!decodedToken) {
            return res.status(401).json({ message: "Invalid token" });
        }

        const user = await User.findById(decodedToken.id).select("-password"); // Fetch user without password
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user; // Attach user to request object
        next();
    } catch (error) {
        res.status(401).json({ message: "Not authorized, token failed" });
    }
};

// Middleware to protect routes for admins only
export const protectAdmin = async (req, res, next) => {
    try {
        const bearer = req.headers.authorization;
        if (!bearer || !bearer.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Authorization token missing or invalid" });
        }

        const token = bearer.split(" ")[1];
        const decodedToken = verifyJWT(token);
        if (!decodedToken) {
            return res.status(401).json({ message: "Invalid token" });
        }

        const user = await User.findById(decodedToken.id);
        if (!user || user.role !== "admin") {
            return res.status(403).json({ message: "Access denied: Admins only" });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: "Not authorized, token failed" });
    }
};
