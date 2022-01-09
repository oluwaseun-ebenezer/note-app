const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const prisma = new PrismaClient();

exports.signup = (req, res) => {
  const { name, email, password } = req.body;

  bcrypt.hash(password, 10).then((hash) => {
    const post = prisma.user
      .create({
        data: {
          name,
          email,
          password: hash,
        },
      })
      .then((user) =>
        res
          .status(201)
          .json({ message: "User created successfully", user: user.email })
      )
      .catch((error) => {
        console.log(error);
        modelErrorHandler("User", "email", error, res);
      });
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  prisma.user
    .findMany({
      where: { email: email },
    })
    .then((user) => {
      if (user.length === 1) {
        bcrypt.compare(password, user[0].password).then((valid) => {
          if (!valid) {
            return res.status(400).json({ message: "Wrong Credentials!" });
          } else {
            const token = jwt.sign(
              { email: user[0].email, id: user[0].id },
              process.env.JWT_KEY,
              { expiresIn: 86400 }
            );

            return res.status(200).json({
              message: "User successfully logged in",
              id: user[0].id,
              email,
              token,
            });
          }
        });
      } else {
        return res.status(400).json({ message: "Wrong Credentials!" });
      }
    })
    .catch((error) => {
      console.log(error);
      return res.status(400).json({ message: "Error logging user in" });
    });
};

exports.verify = (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    const { id, email } = decodedToken;

    if (req.body && req.body.user_id !== id && req.body.email !== email) {
      return res.status(401).json({
        errorMsg: "User invalid!",
      });
    }

    prisma.user
      .findMany({
        where: { email: email },
      })
      .then((user) => {
        if (user.length === 1) {
          return res.status(200).json({});
        }
        return res.status(401).json({
          errorMsg: "User invalid!",
        });
      })
      .catch((error) => {
        console.log(error);
        return res.status(400).json({ message: "Error logging user in" });
      });
  } catch (error) {
    return res.status(401).json({
      message: "You're not authorized to make this request!",
    });
  }
};

const modelErrorHandler = (model, field, error, res) => {
  if (error) {
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ message: `${model}:${field} already exist` });
    } else {
      return res
        .status(400)
        .json({ message: "Unkown error while creating user" });
    }
  }
};
