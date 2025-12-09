import { Router } from "express";
import { requireAuth, attachUser } from "../middleware/auth.middleware";
import {
  handleUploadError,
  uploadLinkedInProfile,
  validateFileUploaded,
} from "../middleware/upload.middleware";
import {
  getAllVerifiedResumes,
  getGithubVerifications,
  getResumeVerifications,
  verifyResumeWithGithub,
  verifyResumeWithLinkedIn,
} from "../controllers/verification.controller";

const router: Router = Router();

router.use(requireAuth);
router.use(attachUser);

router.post(
  "/linkedin",
  uploadLinkedInProfile,
  handleUploadError,
  validateFileUploaded,
  verifyResumeWithLinkedIn,
);

router.post("/github", verifyResumeWithGithub);

router.get("/resumes", getAllVerifiedResumes);
router.get("/resume/:resumeId", getResumeVerifications);
router.get("/github/:resumeId", getGithubVerifications);

export default router;
