const express = require("express");
const router = express.Router();
const subjectController = require("../controllers/subjectController");
const { authenticateUser } = require("../middleware/authMiddleware");
const { authorizeRole } = require("../middleware/roleMiddleware");

router.post(
  "/addsubject",
  authenticateUser,
  authorizeRole(["teacher", "superadmin"]),
  subjectController.createSubject
);
router.get("/allsubject", authenticateUser, subjectController.getAllSubjects);
router.get(
  "/subjectbyid/:id",
  authenticateUser,
  subjectController.getSubjectById
);
router.put(
  "/update/:id",
  authenticateUser,
  authorizeRole(["teacher", "superadmin"]),
  subjectController.updateSubject
);
router.delete(
  "/delete/:id",
  authenticateUser,
  authorizeRole(["teacher", "superadmin"]),
  subjectController.deleteSubject
);

module.exports = router;
