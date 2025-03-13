import User from "../models/User.js";
import { hashPassword, comparePassword, createJWT } from "../utils/auth.js"; 

export const register = async (req, res) => {
    
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await hashPassword(password);

        const newUser = await User.create({ username, email, password: hashedPassword });
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = createJWT(user);
        res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
