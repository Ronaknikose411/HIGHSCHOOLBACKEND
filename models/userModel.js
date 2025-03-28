const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  Admin: { type: String, required: function () { return this.role === "admin"; } },
  email: { type: String, unique: true, sparse: true },
  studentID: { 
    type: String, 
    unique: true, 
    sparse: true, 
    required: function () { return this.role === "student"; }
  },
  teacherID: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  adminID: { 
    type: String, 
    unique: true, 
    sparse: true, 
    required: function () { return this.role === "admin"; }
  },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["student", "teacher", "admin", "superadmin"], 
    required: true 
  },
});

const generateTeacherID = async function () {
  const prefix = "TECH";
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const teacherID = `${prefix}${randomNum}`;
  const existingTeacher = await mongoose.model("User").findOne({ teacherID });
  if (existingTeacher) return generateTeacherID();
  return teacherID;
};

const generateAdminID = async function () {
  const prefix = "ADMIN_";
  for (let i = 1; i <= 99; i++) {
    const adminID = `${prefix}${i.toString().padStart(2, "0")}`;
    const existingAdmin = await mongoose.model("User").findOne({ adminID });
    if (!existingAdmin) return adminID;
  }
  throw new Error("Maximum number of admins (99) reached.");
};

// Ensure pre-save hook is registered
userSchema.pre("save", async function (next) {
  try {
    console.log("Pre-save hook triggered for role:", this.role);
    if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      console.log("Password hashed");
    }
    if (this.role === "teacher" && !this.teacherID) {
      this.teacherID = await generateTeacherID();
      console.log("Generated teacherID:", this.teacherID);
    }
    if (this.role === "admin" && !this.adminID) {
      this.adminID = await generateAdminID();
      console.log("Generated adminID:", this.adminID);
    }
    next();
  } catch (error) {
    console.error("Pre-save hook error:", error);
    next(error);
  }
});

const User = mongoose.model("User", userSchema);
module.exports = { User, generateAdminID }; // Export both