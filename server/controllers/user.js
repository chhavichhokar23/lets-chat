import admin from "../config/firebase-config.js";

export const getAllUsers = async (req, res) => {
  try {
    const listUsersResult = await admin.auth().listUsers(1000);

    const users = listUsersResult.users.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
    }));

    res.status(200).json(users);
  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const getUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const userRecord = await admin.auth().getUser(userId);

    res.status(200).json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || "",
      photoURL: userRecord.photoURL || "",
    });
  } catch (error) {
    console.error("getUser error:", error);
    res.status(404).json({ message: "User not found" });
  }
};
