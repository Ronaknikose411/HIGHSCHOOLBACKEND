const Subject = require("../models/subjectModel");
const {User} = require("../models/userModel");
exports.createSubject = async (req, res) => {
  try {
    if (!req.user || !["teacher", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. Only Teacher or SuperAdmin can create subjects." });
    }

    const { name, passingMarks } = req.body;
    const newSubject = new Subject({ name, passingMarks });
    await newSubject.save();

    res.status(201).json({ message: "Subject created successfully.", subject: newSubject });
  } catch (error) {
    console.error("Error creating subject:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findOne({ subjectID: req.params.id });
    if (!subject) return res.status(404).json({ message: "Subject Not Found" });

    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    if (!req.user || !["teacher", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. Only Teacher or SuperAdmin can update subjects." });
    }

    const subject = await Subject.findOneAndUpdate({ subjectID: req.params.id }, req.body, { new: true });
    if (!subject) return res.status(404).json({ message: "Subject Not Found" });

    res.json({ message: "Subject updated successfully.", subject });
  } catch (error) {
    console.error("Error updating subject:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    if (!req.user || !["teacher", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. Only Teacher or SuperAdmin can delete subjects." });
    }

    const subject = await Subject.findOneAndDelete({ subjectID: req.params.id });
    if (!subject) return res.status(404).json({ message: "Subject Not Found" });

    res.json({ message: "Subject deleted successfully." });
  } catch (error) {
    console.error("Error deleting subject:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};