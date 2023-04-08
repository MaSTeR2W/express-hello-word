process.env.TZ = "Africa/Tripoli";
require("./utilities/datePrototype");
require("dotenv").config();

const mysqlHandler = require("./mysqlHandler-demo/mysqlHandler");
const app = require("./app");

const options = {
  host: "db4free.net",
  user: "marwan",
  password: "123ASD###",
  database: "generalshop",
  port: 3306,
  timezone: "+00:00",
};

mysqlHandler.createConnection(options);

app.listen(3000, () => {
  console.log("server is listening on port 3000");
});

process.on("unhandledRejection", (err) => {
  console.log(err);
});
