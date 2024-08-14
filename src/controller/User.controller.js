import { User } from "../models/User.model.js";
import { Classroom } from "../models/Classroom.model.js";
import moment from "moment";
import { Timetable } from "../models/TimeTable.model.js";
const register = async (req, res) => {
  try {
    const { username, email, password, role, classroom } = req.body;
    // console.log(req.user);
    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: "Please enter all the details" });
    }

    if (req.user.role === "Principle") {
      if (role === "Teacher" || role === "Student") {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ error: "User already exists" });
        }
        const newUser = new User({
          username,
          email,
          password,
          role,
          classroom,
        });
        await newUser.save();
        return res
          .status(201)
          .json({ message: "User registered successfully" });
      } else {
        return res.status(400).json({ error: "Invalid role to create" });
      }
    }

    // Teachers can only create Students
    if (req.user.role === "Teacher") {
      if (role === "Student") {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ error: "User already exists" });
        }
        const newStudent = new User({
          username,
          email,
          password,
          role,
          classroom,
        });
        await newStudent.save();
        return res
          .status(201)
          .json({ message: "User registered successfully" });
      } else {
        return res
          .status(400)
          .json({ error: "Teachers can only create students" });
      }
    }

    return res.status(400).json({ error: "Invalid role for registration" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error in registering the user" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Please enter email and password" });
  }
  const user = await User.findOne({ email });
  if (!user || !(await user.isPasswordCorrect(password))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const token = user.generateAccessToken();
  const loggedInUser = await User.findOne(user._id);
  const options = {
    httpOnly: true,
    secure: true,
  };
  res.status(200).cookie("accessToken", token, options).json({ loggedInUser });
};

const logout = async (req, res) => {
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .json({ msg: "User logged out" });
};

const createClassroom = async (req, res) => {
  //   console.log(req.user);
  if (req.user.role === "Principle") {
    try {
      const { name, startTime, endTime, daysOfWeek } = req.body;

      if (!name || !startTime || !endTime || !daysOfWeek) {
        return res
          .status(400)
          .json({ error: "Please provide all required fields" });
      }

      const newClassroom = new Classroom({
        name,
        startTime,
        endTime,
        daysOfWeek,
      });

      await newClassroom.save();
      return res
        .status(201)
        .json({ message: "Classroom created successfully", newClassroom });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error creating the classroom" });
    }
  } else {
    return res
      .status(403)
      .json({ error: "Only principals can create classrooms" });
  }
};

const assignTeacherToClassroom = async (req, res) => {
  if (req.user.role === "Principle") {
    try {
      const { teacherId, classroomId } = req.body;

      if (!teacherId || !classroomId) {
        return res.status(400).json({
          error: "Please provide both teacher name and classroom name",
        });
      }

      const teacher = await User.findOne({ username: teacherId });
      const classroom = await Classroom.findOne({ name: classroomId });
      //   console.log(classroom);
      if (!teacher || !classroom) {
        return res
          .status(404)
          .json({ error: "Teacher or Classroom not found" });
      }

      if (teacher.role !== "Teacher") {
        return res
          .status(400)
          .json({ error: "Only teachers can be assigned to classrooms" });
      }

      teacher.classroom = classroom._id;
      await teacher.save();

      return res.status(200).json({
        message: "Teacher assigned to classroom successfully",
        teacher,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: "Error assigning teacher to classroom" });
    }
  } else {
    return res
      .status(403)
      .json({ error: "Only principals can assign teachers" });
  }
};

const assignStudentToTeacher = async (req, res) => {
  if (req.user.role === "Principle") {
    try {
      const { studentId, teacherId } = req.body;

      if (!studentId || !teacherId) {
        return res
          .status(400)
          .json({ error: "Please provide both studentId and teacherId" });
      }

      const student = await User.findOne({ username: studentId });
      const teacher = await User.findOne({ username: teacherId });

      if (!student || !teacher) {
        return res.status(404).json({ error: "Student or Teacher not found" });
      }

      if (student.role !== "Student" || teacher.role !== "Teacher") {
        return res.status(400).json({ error: "Invalid roles for assignment" });
      }

      student.teacher = teacher._id;
      await student.save();

      return res
        .status(200)
        .json({ message: "Student assigned to teacher successfully", student });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: "Error assigning student to teacher" });
    }
  } else {
    return res
      .status(403)
      .json({ error: "Only principals can assign students to teachers" });
  }
};

const createTimetable = async (req, res) => {
  try {
    const { classroomId, schedule } = req.body;
    const teacher = req.user;

    if (teacher.role !== "Teacher") {
      return res.status(401).json({ error: "User not authenticated" });
    }
    if (!classroomId || !schedule) {
      return res
        .status(400)
        .json({ error: "Please provide classroomId and schedule" });
    }

    const classroom = await Classroom.findOne({ name: classroomId });

    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found" });
    }

    if (teacher.classroom.toString() !== classroom._id.toString()) {
      return res
        .status(403)
        .json({ error: "You are not assigned to this classroom" });
    }

    const classroomStartTime = moment(classroom.startTime, "HH:mm");
    const classroomEndTime = moment(classroom.endTime, "HH:mm");

    for (const entry of schedule) {
      const { day, startTime, endTime } = entry;

      if (!classroom.daysOfWeek.includes(day)) {
        return res
          .status(400)
          .json({ error: `Classroom is not scheduled for ${day}` });
      }

      //   const scheduleStartTime = moment(startTime, "hh:mm A");
      //   const scheduleEndTime = moment(endTime, "hh:mm A");

      //   if (
      //     scheduleStartTime.isBefore(classroomStartTime) ||
      //     scheduleEndTime.isAfter(classroomEndTime)
      //   ) {
      //     return res
      //       .status(400)
      //       .json({ error: `Schedule times must be within classroom hours` });
      //   }

      //   for (const otherEntry of schedule) {
      //     if (entry !== otherEntry) {
      //       const otherStartTime = moment(otherEntry.startTime, "hh:mm A");
      //       const otherEndTime = moment(otherEntry.endTime, "hh:mm A");
      //       console.log(otherStartTime, "Other Start Time");
      //       console.log(otherEndTime, "Other End Time");
      //       console.log(scheduleStartTime, "Schedule Start Time");
      //       console.log(scheduleEndTime, "Schedule End Time");
      //       if (
      //         day === otherEntry.day &&
      //         scheduleStartTime.isBefore(otherEndTime) &&
      //         scheduleEndTime.isAfter(otherStartTime)
      //       ) {
      //         return res.status(400).json({ error: `Overlapping periods found` });
      //       }
      //     }
      //   }
    }

    const newTimetable = new Timetable({
      classroom: classroom._id,
      teacher: teacher._id,
      schedule,
    });

    await newTimetable.save();
    return res
      .status(201)
      .json({ message: "Timetable created successfully", newTimetable });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error creating timetable" });
  }
};

const listTheTeacher = async (req, res) => {
  if (req.user.role === "Principle") {
    try {
      const user = await User.find({
        role: { $in: ["Teacher", "Student"] },
      });
      if (!user) {
        res
          .status(404)
          .json({ error: "Error in fetching the student and teachers" });
      }
      res.status(200).json({ data: user });
    } catch (error) {
      res.status(500).json({ error });
    }
  } else {
    res.status(403).json({ error: "Only principals can access this endpoint" });
  }
};

const changeDetail = async (req, res) => {
  try {
    if (req.user.role !== "Principle") {
      return res
        .status(403)
        .json({ error: "Only principals can access this endpoint" });
    }

    const { username } = req.params;
    console.log(username);

    const { role, classroom } = req.body;

    // Validate required fields
    if (!username || !email || !role) {
      return res
        .status(400)
        .json({ error: "Please provide all required fields" });
    }

    const classroomDetails = await Classroom.findOne({ name: classroom });
    if (!classroomDetails) {
      return res.status(404).json({ error: "Classroom not found" });
    }

    // Update user details
    const updatedUser = await User.findOneAndUpdate(
      { username },
      {
        role,
        classroom: classroomDetails._id,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log(updatedUser);
    res.status(200).json({ data: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating user details" });
  }
};

const listStudentInClassroom = async (req, res) => {
  if (req.user.role !== "Teacher") {
    return res
      .status(403)
      .json({ error: "Only teachers can access this endpoint" });
  }
  try {
    const { name } = req.params;
    console.log(name);
    if (!name) {
      return res.status(400).json({ error: "Please provide classroom name" });
    }
    const student = await Classroom.findOne({ name });
    if (!student) {
      return res.status(404).json({ error: "Classroom not found" });
    }
    console.log(student);
    res.status(200).json({ data: student.students });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error fetching students in classroom" });
  }
};

const addStudentToClassroom = async (req, res) => {
  if (req.user.role !== "Teacher") {
    return res
      .status(403)
      .json({ error: "Only teachers can access this endpoint" });
  }
  try {
    const { classroomName, studentUsername } = req.body;
    console.log(classroomName, studentUsername);
    if (!classroomName || !studentUsername) {
      return res
        .status(400)
        .json({ error: "Please provide classroom name and student username" });
    }
    const classroom = await Classroom.findOne({ name: classroomName });
    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found" });
    }
    const student = await User.findOne({ username: studentUsername });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    classroom.students.push(student._id);
    const data = await classroom.save();

    res.status(200).json({ data });
  } catch {
    console.error(error);
    return res.status(400).json(error);
  }
};

const changeStudentDetails = async (req, res) => {
  console.log(req.user);
  if (req.user.role !== "Teacher") {
    return res
      .status(403)
      .json({ error: "Only teachers can access this endpoint" });
  }
  try {
    const { role, teacher } = req.body;
    const { username } = req.params;
    if (!username || !role) {
      return res
        .status(400)
        .json({ error: "Please provide all required fields" });
    }
    const teacherDetails = await User.findOne({ username: teacher });
    if (!teacherDetails) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { username },
      {
        role,
        teacher: teacherDetails._id,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ data: updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error updating user details" });
  }
};

export {
  register,
  login,
  logout,
  createClassroom,
  assignTeacherToClassroom,
  assignStudentToTeacher,
  createTimetable,
  listTheTeacher,
  changeDetail,
  listStudentInClassroom,
  addStudentToClassroom,
  changeStudentDetails,
};
