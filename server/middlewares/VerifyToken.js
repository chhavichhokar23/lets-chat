import admin from "../config/firebase-config.js";

export const VerifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No authorization header" });
    }

    const token = authHeader.split(" ")[1];

    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("VerifyToken error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const VerifySocketToken = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("No token provided"));
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    socket.user = decodedToken;

    next();
  } catch (error) {
    console.error("VerifySocketToken error:", error);
    next(new Error("Unauthorized"));
  }
};
