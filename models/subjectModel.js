const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  subjectID: { type: String, unique: true },
  name: { type: String, required: true },
  passingMarks: { type: Number, required: true },
});

async function generateSubjectID() {
  const lastSubject = await mongoose.model("Subject").findOne().sort({ subjectID: -1 });
  if (lastSubject && lastSubject.subjectID) {
    const lastID = parseInt(lastSubject.subjectID.replace("SUB", ""), 10);
    return `SUB${String(lastID + 1).padStart(3, "0")}`;
  }
  return "SUB001";
}

subjectSchema.pre("save", async function (next) {
  if (!this.subjectID) {
    try {
      this.subjectID = await generateSubjectID();
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model("Subject", subjectSchema);