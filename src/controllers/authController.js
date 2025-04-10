const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const AppError = require("../utils/appError");
const prisma = require("../config/prisma");

const generateAccessToken = (minUserData) => {
  return jwt.sign(minUserData, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

const saveRefreshToken = async (userId, token) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: token },
  });
};

exports.register = async (req, res, next) => {
  /* #swagger.tags = ['User']*/
  try {
    const { email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return next(AppError.conflict("Email already in use"));
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    const minUserData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const accessToken = generateAccessToken(minUserData);
    const refreshToken = generateRefreshToken(user.id);

    await saveRefreshToken(user.id, refreshToken);

    res.status(201).json({
      status: "success",
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  /* #swagger.tags = ['User']*/
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(AppError.unauthorized("Invalid credentials"));
    }
    const minUserData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const accessToken = generateAccessToken(minUserData);
    const refreshToken = generateRefreshToken(user.id);
    await saveRefreshToken(user.id, refreshToken);

    res.status(200).json({
      status: "success",
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  /* #swagger.tags = ['User']*/
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return next(AppError.badRequest("Refresh token required"));

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });
    if (!user || user.refreshToken !== refreshToken) {
      return next(AppError.unauthorized("Invalid refresh token"));
    }

    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    await saveRefreshToken(user.id, newRefreshToken);

    res.status(200).json({
      status: "success",
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  /* #swagger.tags = ['User']*/
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refreshToken: null },
    });

    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = (req, res) => {
  /* #swagger.tags = ['User']*/
  res.status(200).json({
    status: "success",
    data: { user: req.user },
  });
};
