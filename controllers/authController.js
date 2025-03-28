const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const {User} = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, studentID, teacherID, adminID, password } = req.body;

  if (!password || (!email && !studentID && !adminID && !teacherID)) {
    return res.status(400).json({ message: "Password and one of email, studentID, adminID or teacherID are required." });
  }

  try {
    if (email === "SuperAdmin@nws.com" && password === "SuperAdmin3000") {
      const token = jwt.sign(
        { role: "superadmin", email: "SuperAdmin@nws.com" },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
      return res.json({
        token,
        role: "superadmin",
        email: "SuperAdmin@nws.com",
      });
    }

    console.log("User model:", User); // Should log the Mongoose model (e.g., Model { User })
    let user;
    if (email) user = await User.findOne({ email });
    else if (studentID) user = await User.findOne({ studentID });
    else if (teacherID) user = await User.findOne({ teacherID });
    else if (adminID) user = await User.findOne({ adminID });
    if (!user) return res.status(400).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password." });

    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: "2h" }
    );
    res.json({ token, role: user.role, name: user.name });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
exports.logout = async (req, res) => {
  try {
    res.clearCookie("token");
    res.json({ message: "Logout successful." });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.userinfo = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user && decoded.role !== "superadmin") {
      return res.status(404).json({ message: "User not found" });
    }

    if (decoded.role === "superadmin") {
      return res.status(200).json({ email: decoded.email, role: "superadmin" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Userinfo error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};