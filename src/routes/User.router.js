import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  login,
  logout,
  register,
  createClassroom,
  createTimetable,
  assignTeacherToClassroom,
  assignStudentToTeacher,
  listTheTeacher,
  changeDetail,
  listStudentInClassroom,
  addStudentToClassroom,
  changeStudentDetails,
} from "../controller/User.controller.js";

const router = Router();

router.route("/register").post(verifyJWT, register);
router.route("/login").post(login);
router.route("/logout").post(logout);
router.route("/createClassroom").post(verifyJWT, createClassroom);
router.route("/createTimetable").post(verifyJWT, createTimetable);
router.route("/studenttot").post(verifyJWT, assignStudentToTeacher);
router.route("/teachertoc").post(verifyJWT, assignTeacherToClassroom);
router.route("/listTeacher").post(verifyJWT, listTheTeacher);
router.route("/updateDetails/:username").post(verifyJWT, changeDetail);
router.route("/listOfStudent/:name").post(verifyJWT, listStudentInClassroom);
router.route("/addStudentToClassroom").post(verifyJWT, addStudentToClassroom);
router
  .route("/changeStudentDetails/:username")
  .post(verifyJWT, changeStudentDetails);
export default router;
