const express = require("express");

const { login, logout, userinfo } = require("../controllers/authController");
const { authenticateUser } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/login",  login);
router.post("/logout", logout);
router.get("/user", authenticateUser, userinfo);


module.exports = router;