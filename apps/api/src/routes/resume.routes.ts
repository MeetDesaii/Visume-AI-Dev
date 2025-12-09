import { Router } from "express";
import { requireAuth, attachUser } from "../middleware/auth.middleware";
import {
  handleUploadError,
  uploadResume,
  validateFileUploaded,
} from "../middleware/upload.middleware";
import {
  extractResumeInfo,
  getAllResumes,
  getResume,
  getResumeReview,
  tailorResume,
} from "../controllers/resume.controller";

const router: Router = Router();

// All routes require authentication
router.use(requireAuth);
router.use(attachUser);

router.post(
  "/extract",
  uploadResume,
  handleUploadError,
  validateFileUploaded,
  extractResumeInfo,
);
router.post("/:resumeId/tailor", tailorResume);
router.get("/:resumeId/tailor", getResumeReview);

router.get("/", getAllResumes);
router.get("/:resumeId", getResume);

export default router;
