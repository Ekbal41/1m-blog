const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const prisma = require("../config/prisma");

module.exports = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(AppError.unauthorized());
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!currentUser) {
      return next(AppError.userNotFound());
    }

    req.user = currentUser;
    next();
  } catch (err) {
    next(err);
  }
};
