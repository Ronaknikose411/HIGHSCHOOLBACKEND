const express = require("express");
const { Mark } = require("../models/markModel");
const { authenticateUser } = require("../middleware/authMiddleware");
const { authorizeRole } = require("../middleware/roleMiddleware");
const router = express.Router();

router.get("/students-marks", authenticateUser, authorizeRole(["teacher", "admin", "superadmin"]), async (req, res) => {
  try {
    const marks = await Mark.find().populate("studentId", "studentId name").populate("subject", "name");
    res.status(200).json(marks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/add-mark", authenticateUser, authorizeRole(["teacher"]), async (req, res) => {
  try {
    const { studentId, subject, score } = req.body;
    const status = score >= 40 ? "Pass" : "Fail";
    const mark = new Mark({ studentId, subject, score, status });
    await mark.save();
    res.status(201).json({ message: "Mark added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;