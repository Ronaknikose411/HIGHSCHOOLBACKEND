const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";


exports.authenticateUser = (req, res, next) => {
  // Retrieve the Authorization header
  const authHeader = req.header("Authorization");
  
  console.log(authHeader);
  if (!authHeader) {
    return res.status(401).json({ message: "Access Denied. No token provided." });
  }

  try {
    const verify=jwt.verify(authHeader.split(' ')[1],process.env.JWT_SECRET)
    req.user = verify
 
    next();
  }
 /*  // Ensure the header starts with "Bearer " and extract the token
  const tokenParts = authHeader.split(" ");
  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    return res.status(401).json({ message: "Invalid Authorization header format. Use 'Bearer <token>'" });
  }

  const token = tokenParts[1]; // Extract the token from the header
  if (!token) {
    return res.status(401).json({ message: "Token missing after Bearer" });
  }
console.log(token , "check");
  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach the decoded user information to the request
    next(); // Proceed to the next middleware or route handler */
  catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ message: `Invalid token: ${error.message}` }); // Use 401 for invalid token
  }};
  
  exports.verifySuperAdmin = (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (!authHeader) return res.status(403).json({ message: "Access denied. No token provided." });
  
    try {
      const token = authHeader.replace("Bearer ", "");
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role !== "superadmin") {
        return res.status(403).json({ message: "Access denied. Not a superadmin." });
      }
      req.user = decoded;
      next();
    } catch (error) {
      console.error("Superadmin token verification failed:", error);
      return res.status(403).json({ message: "Invalid token." });
    }
  };