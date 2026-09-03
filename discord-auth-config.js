import { firebaseConfig } from "./firebase-config.js";

// The backend is deployed to the same Firebase project.
export const discordAuthUrl =
  `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/discordAuth`;
