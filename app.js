const appOptionhandler = require("./handlers/appOPtionHandler");

appOptionhandler.createOptionIfNotExist();

for (let i = 0; i < 10000; i++) {
  const a = 10;
}

const express = require("express");
const cookieParser = require("cookie-parser");
const expressRateLimit = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");
const hpp = require("hpp");
const { isClosed } = require("./controllers/authController");

const app = express();

app.enable("trust proxy");
app.set("trust proxy", 1);

const limiter = {
  windowMs: 40 * 60 * 1000,
  max: 1200,
  standardHeaders: true,
  legacyHeaders: false,
  message: "طلبات كثيرة جدا. حاول مرة أخرى لاحقا",
};
app.use(expressRateLimit(limiter));

app.use(cookieParser());

app.use(isClosed);

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(xss());
app.use(
  hpp({
    whitelist: ["status"],
  })
);

app.use(express.urlencoded({ extended: true, limit: "3kb" }));
app.use(express.json({ limit: "2kb" }));

app.use(express.static(__dirname + "/public"));

app.set("views", __dirname + "/views");

const registrationRouter = require("./routes/registrationRoute");
const errorController = require("./controllers/errorController");
const userRoute = require("./routes/userRoute");
const classRoute = require("./routes/classRoute");
const deletedUserRoute = require("./routes/deletedUserRoute");
const deletedClassRoute = require("./routes/deletedClassRoute");
const deletedProductRoute = require("./routes/deletedProductRoute");
const orderRoute = require("./routes/orderRoute");
const searchRoute = require("./routes/searchRoute");
const mainPageRoute = require("./routes/mainPageRoute");
const notificationRoute = require("./routes/notificationRoute");
const ipRoute = require("./routes/ipRoute");
const errLogRoute = require("./routes/errLogRoute");
const cities = require("./models/cityModel");
const imageRoute = require("./routes/imageRoute");

app.use("/registration", registrationRouter);
app.use("/users", userRoute);
app.use("/classifications", classRoute);
app.use("/deletedUsers", deletedUserRoute);
app.use("/deletedClassifications", deletedClassRoute);
app.use("/deletedProducts", deletedProductRoute);
app.use("/orders", orderRoute);
app.use("/search", searchRoute);
app.use("/home", mainPageRoute);
app.use("/notifications", notificationRoute);
app.use("/ips", ipRoute);
app.use("/errLogs", errLogRoute);
app.use("/imagesOfProducts", imageRoute);
app.get("/cities", (req, res, next) => {
  res.status(200).json(cities);
});

app.all("*", (req, res, next) => {
  res.status(404).json({ errMessage: "هذا المسار غير موجود في الوقت الحالي" });
});

app.use(errorController);

app.get("/test/t", (req, res) => {
  console.log(req.path);
  res.send("");
});

module.exports = app;
