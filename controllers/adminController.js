const { User, generateAdminID } = require("../models/userModel");

const adminController = {
  addAdmin: async (req, res) => {
    if (!req.user || req.user.role !== "superadmin") {
        return res.status(403).json({ message: "Only superadmin can create an admin." });
    }
    
    const { name, email, password } = req.body;
    if (!password) return res.status(400).json({ message: "Password is required." });
    
    try {
        const adminCount = await User.countDocuments({ role: "admin" });
        if (adminCount >= 3) {
            return res.status(400).json({ message: "Maximum of 3 admins can be added." });
        }

        const newAdmin = new User({
            name,
            email,
            password,
            role: "admin",
            Admin: req.user?.name || "Superadmin",
        });

        // Generate adminID before saving
        newAdmin.adminID = await generateAdminID();
        console.log("Generated adminID:", newAdmin.adminID);

        console.log("New admin before save:", newAdmin.toObject());
        await newAdmin.save();
        console.log("New admin after save:", newAdmin.toObject());

        return res.status(201).json({
            message: "Admin added successfully.",
            admin: {
                name: newAdmin.name,
                email: newAdmin.email,
                adminID: newAdmin.adminID,
            },
        });
    } catch (error) {
        console.error("Error adding admin:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
},


  addTeacher: async (req, res) => {
    if (!req.user || !["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. Only admin or superadmin can create a teacher." });
    }

    const { name, email, password } = req.body;
    if (!password) return res.status(400).json({ message: "Password is required." });

    try {
      const newTeacher = new User({
        name,
        email,
        password,
        role: "teacher",
        Admin: req.user?.name || "superadmin",
      });
      await newTeacher.save();
      return res.status(201).json({
        message: "Teacher added successfully.",
        teacher: {
          name: newTeacher.name,
          email: newTeacher.email,
          role: newTeacher.role,
          teacherID: newTeacher.teacherID,
        },
      });
    } catch (error) {
      console.error("Error adding teacher:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },

  updateAdmin: async (req, res) => {
    if (!req.user || req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Only superadmin can update admin details." });
    }

    const { adminID } = req.params;
    const { name, email, password } = req.body;

    try {
      const admin = await User.findOne({ adminID, role: "admin" });
      if (!admin) return res.status(404).json({ message: "Admin not found." });

      if (name) admin.name = name;
      if (email) admin.email = email;
      if (password) admin.password = password; // Will be hashed by pre-save hook

      await admin.save();
      return res.status(200).json({
        message: "Admin updated successfully.",
        admin: {
          name: admin.name,
          email: admin.email,
          adminID: admin.adminID,
          role: admin.role,
        },
      });
    } catch (error) {
      console.error("Error updating admin:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },

  deleteAdmin: async (req, res) => {
    if (!req.user || req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Only superadmin can delete admin details." });
    }

    const { adminID } = req.params;

    try {
      const admin = await User.findOneAndDelete({ adminID, role: "admin" });
      if (!admin) return res.status(404).json({ message: "Admin not found." });

      return res.status(200).json({ message: "Admin deleted successfully." });
    } catch (error) {
      console.error("Error deleting admin:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },

  updateTeacher: async (req, res) => {
    if (!req.user || req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Only superadmin can update teacher details." });
    }

    const { teacherID } = req.params;
    const { name, email, password } = req.body;

    try {
      const teacher = await User.findOne({ teacherID, role: "teacher" });
      if (!teacher) return res.status(404).json({ message: "Teacher not found." });

      if (name) teacher.name = name;
      if (email) teacher.email = email;
      if (password) teacher.password = password;

      await teacher.save();
      return res.status(200).json({
        message: "Teacher updated successfully.",
        teacher: {
          name: teacher.name,
          email: teacher.email,
          role: teacher.role,
          teacherID: teacher.teacherID,
        },
      });
    } catch (error) {
      console.error("Error updating teacher:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },

  deleteTeacher: async (req, res) => {
    if (!req.user || req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Only superadmin can delete teacher details." });
    }

    const { teacherID } = req.params;

    try {
      const teacher = await User.findOneAndDelete({ teacherID, role: "teacher" });
      if (!teacher) return res.status(404).json({ message: "Teacher not found." });

      return res.status(200).json({ message: "Teacher deleted successfully." });
    } catch (error) {
      console.error("Error deleting teacher:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },

  getAllAdminsAndTeachers: async (req, res) => {
    // Check if user is authenticated and has a valid role
    if (!req.user || !["superadmin", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. Requires admin or superadmin role." });
    }

    try {
      let admins = [];
      let teachers = [];

      // Superadmin gets both admins and teachers
      if (req.user.role === "superadmin") {
        admins = await User.find({ role: "admin" }).select("name email adminID role");
        teachers = await User.find({ role: "teacher" }).select("name email teacherID role");
      } 
      // Admin gets only teachers
      else if (req.user.role === "admin") {
        teachers = await User.find({ role: "teacher" }).select("name email teacherID role");
      }

      return res.status(200).json({
        message: "Data retrieved successfully.",
        admins, // Empty array for admins if user is not superadmin
        teachers,
      });
    } catch (error) {
      console.error("Error fetching admins and teachers:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
};

module.exports = adminController;