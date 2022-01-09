const express = require("express");
const userController = require("./user.controller");
const userMiddleware = require("./user.middleware");
const ExpressRedisCache = require("express-redis-cache");
const client = require("prom-client");

const app = express();

const register = new client.Registry();

register.setDefaultLabels({ app: "note-service" });

client.collectDefaultMetrics({ register });

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const cache = ExpressRedisCache({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  expire: 60,
});

app.get("/user/metrics", async (req, res) => {
  if (req.accepts(register.contentType)) {
    res.contentType(register.contentType);
    return res.send(await register.metrics());
  }

  return res.send(await register.metrics());
});

app.head("/user", async (req, res) => {
  res.status(200).json({});
});

app.post(
  "/user/signup",
  userMiddleware.user_signup_data_check,
  userController.signup
);
app.post(
  "/user/login",
  userMiddleware.user_login_data_check,
  cache.route(),
  userController.login
);
app.post("/user/verify", userController.verify);

module.exports = app;
