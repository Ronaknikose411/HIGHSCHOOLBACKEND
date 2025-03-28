const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticateUser, verifySuperAdmin } = require("../middleware/authMiddleware");
const { authorizeRole } = require("../middleware/roleMiddleware");

router.post("/add-admin", authenticateUser, verifySuperAdmin, adminController.addAdmin);
router.post("/add-teacher", authenticateUser, authorizeRole(["admin", "superadmin"]), adminController.addTeacher);
router.put("/updateteacher/:teacherID", authenticateUser, verifySuperAdmin, adminController.updateTeacher);
router.delete("/deleteteacher/:teacherID", authenticateUser, verifySuperAdmin, adminController.deleteTeacher);
router.put("/update/:adminID", authenticateUser, verifySuperAdmin, adminController.updateAdmin); // New route
router.delete("/delete/:adminID", authenticateUser, verifySuperAdmin, adminController.deleteAdmin); // New route
router.get("/administration", authenticateUser, authorizeRole(["admin", "superadmin"]), adminController.getAllAdminsAndTeachers);

module.exports = router;