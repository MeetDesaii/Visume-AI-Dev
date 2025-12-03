import { Router } from "express";
import { requireAuth, attachUser } from "../middleware/auth.middleware";
import {
  handleUploadError,
  uploadLinkedInProfile,
  validateFileUploaded,
} from "../middleware/upload.middleware";
import {
  getAllVerifiedResumes,
  getResumeVerifications,
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

router.get("/resumes", getAllVerifiedResumes);
router.get("/resume/:resumeId", getResumeVerifications);

export default router;
