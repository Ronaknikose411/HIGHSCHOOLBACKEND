const express = require("express");
const { createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent } = require("../controllers/studentController");
const { authenticateUser } = require("../middleware/authMiddleware");
const { authorizeRole } = require("../middleware/roleMiddleware");
const router = express.Router();

router.post("/addstudent", authenticateUser, authorizeRole(["admin", "superadmin"]), createStudent);
router.get("/allstudent", authenticateUser, authorizeRole(["teacher", "admin", "superadmin"]), getAllStudents);
router.get("/studentbyid/:id", authenticateUser, getStudentById);
router.put("/update/:id", authenticateUser, authorizeRole(["admin", "superadmin"]), updateStudent);
router.delete("/delete/:id", authenticateUser, authorizeRole(["admin", "superadmin"]), deleteStudent);

module.exports = router;