const express = require("express");
const markController = require("../controllers/markController");
const { authenticateUser } = require("../middleware/authMiddleware");
const { authorizeRole } = require("../middleware/roleMiddleware");
const router = express.Router();

router.post("/addmarks/:subjectID", authenticateUser, authorizeRole(["teacher"]), markController.addMark);
router.get("/studentallmarks", authenticateUser, authorizeRole(["teacher", "admin", "superadmin"]), markController.getAllStudentsWithMarks);
router.get("/subjectmarks/:subjectID", authenticateUser, authorizeRole(["teacher", "admin", "superadmin"]), markController.getSubjectMarks);
router.get("/result/:studentId", authenticateUser, markController.getStudentMarksResult);
router.put("/update/:subjectID", authenticateUser, authorizeRole(["teacher","superadmin"]), markController.updateMark);
router.delete("/delete/:subjectID", authenticateUser, authorizeRole(["teacher", "superadmin"]), markController.deleteMark);

module.exports = router;