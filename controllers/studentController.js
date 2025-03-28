const Student = require("../models/studentModel");
const Mark = require("../models/markModel");
const {User} = require("../models/userModel");
const bcrypt = require("bcryptjs");
const Subject = require("../models/subjectModel");

exports.createStudent = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Access denied. Only Admin or SuperAdmin can add students." });
    }

    const { name, email, age, password } = req.body;
    if (!name || !email || !age || !password) return res.status(400).json({ message: "All fields are required." });

    const lastStudent = await Student.findOne().sort({ _id: -1 });
    let newIdNumber = 10000;
    if (lastStudent && lastStudent.studentId) {
      const lastNumber = parseInt(lastStudent.studentId.replace("STD", ""), 10);
      newIdNumber = lastNumber + 1;
    }
    const studentId = `STD${newIdNumber}`;

    const student = await Student.create({ studentId, name, email, age });
    const user = await User.create({ name, email, studentID: student.studentId, password, role: "student" });

    res.status(201).json({ message: "Student added successfully.", student, user });
  } catch (error) {
    console.error("Error adding student:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    if (!req.user || !["teacher", "admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. Only Teacher, Admin, or SuperAdmin can access this." });
    }

    const students = await Student.find().select("studentId name email age");
    const response = { students, total: students.length };
    res.json(response);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    // Fetch student by studentId
    const student = await Student.findOne({ studentId: req.params.id });
    if (!student) return res.status(404).json({ message: "Student Not Found" });

    // Fetch all subjects
    const allSubjects = await Subject.find({}, "subjectID name"); // Only fetch subjectID and name

    // Fetch marks and populate the subject field
    const marks = await Mark.find({ studentId: student._id }).populate("subject", "subjectID name");

    // Transform the marks array (without cumulative obtainedMarks)
    const transformedMarks = marks.map((mark) => ({
      _id: mark._id,
      studentId: mark.studentId,
      subjectID: mark.subject ? mark.subject.subjectID : "Unknown",
      subjectName: mark.subject ? mark.subject.name : "Unknown",
      score: mark.score,
      totalMarks: mark.totalMarks,
      status: mark.status,
      createdAt: mark.createdAt,
      markID: mark.markID,
      __v: mark.__v,
    }));

    // Check if all subjects have marks
    const markedSubjectIds = new Set(transformedMarks.map((mark) => mark.subjectID));
    const allSubjectIds = new Set(allSubjects.map((subject) => subject.subjectID));
    const missingSubjects = allSubjects
      .filter((subject) => !markedSubjectIds.has(subject.subjectID))
      .map((subject) => ({ subjectID: subject.subjectID, subjectName: subject.name }));

    // Calculate Percentage object
    let Percentage;
    const totalSubjects = allSubjects.length; // Total number of subjects in the system
    const totalMarks = totalSubjects * 100; // Total marks = total subjects * 100
    const totalScore = transformedMarks.reduce((sum, mark) => sum + mark.score, 0); // Sum of all scores

    if (missingSubjects.length > 0) {
      Percentage = {
        "total marks": totalMarks,
        obtainedMarks: totalScore,
        status: "Pending",
        missingSubjects: missingSubjects,
      };
    } else {
      const percentage = totalMarks ? ((totalScore / totalMarks) * 100).toFixed(2) : 0;
      Percentage = {
        "total marks": totalMarks,
        obtainedMarks: totalScore,
        status: `${percentage}%`,
        missingSubjects: [],
      };
    }

    res.json({ student, marks: transformedMarks, Percentage });
  } catch (error) {
    console.error("Error fetching student by ID:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    if (!req.user || !["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. Only Admin or SuperAdmin can update students." });
    }

    const student = await Student.findOneAndUpdate({ studentId: req.params.id }, req.body, { new: true });
    if (!student) return res.status(404).json({ message: "Student Not Found" });

    res.json({ message: "Student updated successfully.", student });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    if (!req.user || !["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. Only Admin or SuperAdmin can delete students." });
    }

    const student = await Student.findOneAndDelete({ studentId: req.params.id });
    if (!student) return res.status(404).json({ message: "Student Not Found" });

    res.json({ message: "Student deleted successfully." });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};