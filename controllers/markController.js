const Mark = require("../models/markModel");
const Student = require("../models/studentModel");
const Subject = require("../models/subjectModel");
const {User} = require("../models/userModel");
const markController = {
  addMark: async (req, res) => {
    try {
      if (!req.user || req.user.role !== "teacher") {
        return res.status(403).json({ message: "Only Teacher can add marks." });
      }

      const { studentId, score } = req.body;
      const { subjectID } = req.params;

      if (!studentId || !subjectID || score === undefined) {
        return res.status(400).json({ message: "Student ID, subject ID, and score are required." });
      }

      const student = await Student.findOne({ studentId });
      if (!student) return res.status(404).json({ message: "Student not found." });

      const subject = await Subject.findOne({ subjectID });
      if (!subject) return res.status(404).json({ message: "Subject not found." });

      const existingMark = await Mark.findOne({ studentId: student._id, subject: subject._id });
      if (existingMark) {
        return res.status(400).json({ message: "Mark already added for this student and subject." });
      }

      const newMark = new Mark({ studentId: student._id, subject: subject._id, score });
      await newMark.save();

      student.marks.push(newMark._id);
      await student.save();

      return res.status(201).json({ message: "Mark added successfully.", mark: newMark });
    } catch (error) {
      console.error("Error adding mark:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },

  getAllStudentsWithMarks: async (req, res) => {
    try {
      if (!req.user || !["teacher", "admin", "superadmin"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied. Only Teacher, Admin, or SuperAdmin can show all student's marks." });
      }

      const students = await Student.find().populate({ path: "marks", populate: { path: "subject", model: "Subject" } });

      const studentMarks = students.map((student) => {
        const marksBySubject = student.marks.map((mark) => ({
          subject: mark.subject ? mark.subject.name : "Subject Not Found",
          score: mark.score,
        }));

        if (marksBySubject.length === 0) {
          return { studentId: student.studentId, name: student.name, obtainedMarks: 0, percentage: "", marks: marksBySubject };
        }

        let totalObtainedMarks = 0;
        let hasFailed = false;
        marksBySubject.forEach((mark) => {
          totalObtainedMarks += mark.score;
          if (mark.score < 35) hasFailed = true;
        });

        const status = hasFailed ? "Fail" : "Pass";
        const percentage = marksBySubject.length > 0 ? (totalObtainedMarks / marksBySubject.length).toFixed(2) : "";

        return {
          studentId: student.studentId,
          name: student.name,
          obtainedMarks: totalObtainedMarks,
          percentage: marksBySubject.length > 0 ? percentage : "",
          status,
          marks: marksBySubject,
        };
      });

      if (studentMarks.length === 0) return res.status(404).json({ message: "No student marks found." });
      return res.status(200).json(studentMarks);
    } catch (error) {
      console.error("Error retrieving student marks:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },

  getStudentMarksResult: async (req, res) => {
    const { studentId } = req.params;
    try {
      const student = await Student.findOne({ studentId });
      if (!student) return res.status(400).json({ message: "Student not found." });
  
      const marks = await Mark.find({ studentId: student._id }).populate("subject", "name passingMarks");
      const totalMarksPossible = marks.length
        ? marks.reduce((acc, mark) => acc + mark.subject.passingMarks * (100 / mark.subject.passingMarks), 0)
        : 0;
      const obtainedMarks = marks.length ? marks.reduce((acc, mark) => acc + mark.score, 0) : 0;
      const percentage = totalMarksPossible ? ((obtainedMarks / totalMarksPossible) * 100).toFixed(2) : "0.00";
      const status = marks.length ? (marks.every(mark => mark.score >= mark.subject.passingMarks) ? "PASS" : "FAIL") : "N/A";
  
      res.status(200).json({
        studentId: student.studentId,
        name: student.name,
        obtainedMarks,
        percentage,
        status,
        marks: marks.map(mark => ({
          subject: mark.subject.name,
          score: mark.score,
        })),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

    updateMark: async (req, res) => {
      try {
        // Allow both "teacher" and "superadmin" roles
        if (!req.user || !["teacher", "superadmin"].includes(req.user.role)) {
          return res.status(403).json({ message: "Only teachers and superadmins can update marks." });
        }
  
        const { studentId, score } = req.body;
        const { subjectID } = req.params;
  
        if (!studentId || !subjectID || score === undefined) {
          return res.status(400).json({ message: "Student ID, subject ID, and score are required." });
        }
  
        const student = await Student.findOne({ studentId });
        if (!student) return res.status(404).json({ message: "Student not found." });
  
        const subject = await Subject.findOne({ subjectID });
        if (!subject) return res.status(404).json({ message: "Subject not found." });
  
        let existingMark = await Mark.findOne({ studentId: student._id, subject: subject._id });
  
        if (existingMark) {
          existingMark.score = score;
          await existingMark.save();
          return res.status(200).json({ message: "Mark updated successfully.", mark: existingMark });
        } else {
          const newMark = new Mark({ studentId: student._id, subject: subject._id, score });
          await newMark.save();
          student.marks.push(newMark._id);
          await student.save();
          return res.status(201).json({ message: "Mark added successfully.", mark: newMark });
        }
      } catch (error) {
        console.error("Error updating mark:", error);
        if (error.code === 11000) return res.status(400).json({ message: "Duplicate markID detected. Please try again." });
        return res.status(500).json({ message: "Internal server error." });
      }
    },
  
    deleteMark: async (req, res) => {
      try {
        // Allow both "teacher" and "superadmin" roles
        if (!req.user || !["teacher", "superadmin"].includes(req.user.role)) {
          return res.status(403).json({ message: "Only teachers and superadmins can delete marks." });
        }
  
        const { studentId } = req.body;
        const { subjectID } = req.params;
  
        if (!studentId || !subjectID) {
          return res.status(400).json({ message: "Student ID and subject ID are required." });
        }
  
        const student = await Student.findOne({ studentId });
        if (!student) return res.status(404).json({ message: "Student not found." });
  
        const subject = await Subject.findOne({ subjectID });
        if (!subject) return res.status(404).json({ message: "Subject not found." });
  
        const mark = await Mark.findOne({ studentId: student._id, subject: subject._id });
        if (!mark) return res.status(404).json({ message: "Mark not found." });
  
        await Mark.deleteOne({ _id: mark._id });
        student.marks.pull(mark._id);
        await student.save();
  
        return res.status(200).json({ message: "Mark deleted successfully." });
      } catch (error) {
        console.error("Error deleting mark:", error);
        return res.status(500).json({ message: "Internal server error." });
      }
    },

  getSubjectMarks: async (req, res) => {
    try {
      if (!req.user || !["teacher", "admin", "superadmin"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied. Only Teacher, Admin, or SuperAdmin can show all student's marks." });
      }

      const { subjectID } = req.params;
      const subject = await Subject.findOne({ subjectID });
      if (!subject) return res.status(404).json({ message: "Subject not found." });

      const students = await Student.find().populate({ path: "marks", match: { subject: subject._id }, select: "score subject" });

      const studentMarks = students.map((student) => {
        const mark = student.marks.find((m) => m.subject && m.subject.equals(subject._id));
        return { studentId: student.studentId, name: student.name, score: mark ? mark.score : 0 };
      });

      return res.status(200).json({ subjectName: subject.name, marks: studentMarks });
    } catch (error) {
      console.error("Error fetching subject marks:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
};

module.exports = markController;