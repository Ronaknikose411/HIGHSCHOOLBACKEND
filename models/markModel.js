const mongoose = require("mongoose");

const markSchema = new mongoose.Schema({
  markID: { type: String, unique: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  totalMarks: { type: Number, default: 100 },
  percentage: { type: Number },
  obtainedMarks: { type: Number },
  status: { type: String, enum: ["Pass", "Fail"], default: "Fail" },
  createdAt: { type: Date, default: Date.now },
});

markSchema.pre("save", async function (next) {
  if (!this.markID) {
    const count = await mongoose.model("Mark").countDocuments();
    this.markID = `MARK${String(count + 1).padStart(5, "0")}`;
  }

  const marks = await mongoose.model("Mark").find({ studentId: this.studentId });
  const totalObtainedMarks = marks.reduce((acc, mark) => acc + mark.score, 0);
  const totalSubjects = marks.length;

  this.obtainedMarks = totalObtainedMarks;
  this.percentage = totalSubjects > 0 ? (totalObtainedMarks / (totalSubjects * this.totalMarks)) * 100 : 0;
  this.status = this.score >= 35 ? "Pass" : "Fail";

  next();
});

module.exports = mongoose.model("Mark", markSchema);