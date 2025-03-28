const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number, required: true },
  marks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Mark" }],
});

studentSchema.pre("save", async function (next) {
  if (!this.studentId) {
    const lastStudent = await this.constructor.findOne().sort({ _id: -1 });
    let newIdNumber = 10000;
    if (lastStudent && lastStudent.studentId) {
      const lastNumber = parseInt(lastStudent.studentId.replace("STD", ""), 10);
      newIdNumber = lastNumber + 1;
    }
    this.studentId = `STD${newIdNumber}`;
  }
  next();
});

module.exports = mongoose.model("Student", studentSchema);