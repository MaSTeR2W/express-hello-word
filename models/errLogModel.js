const mysqlHandler = require("./../mysqlHandler-demo/mysqlHandler");

const errLogTable = {
  errorId: {
    type: "number",
    dataType: "MEDIUMINT",
    unsigned: true,
    autoIncrement: true,
  },
  errMessage: {
    type: "string",
    dataType: "VARCHAR(700)",
    maxLength: {
      length: 700,
      errMessage: "error message should be at most 700 characters",
    },
  },
  errCode: {
    type: "string",
    dataType: "VARCHAR(50)",
    unsigned: true,
  },
  statusCode: {
    type: "number",
    dataType: "SMALLINT",
    unsigned: true,
  },
  errStack: {
    type: "string",
    dataType: "VARCHAR(1500)",
    maxLength: {
      length: 1500,
      errMessage: "Error stack should be at most 1500 charachater",
    },
  },
  originatedBy: {
    type: "string",
    dataType: "VARCHAR(40)",
    maxLength: {
      length: 40,
      errMessage: "Originated by should be at most 40 charachater",
    },
  },
  createdAt: {
    type: "date",
    dataType: "DATETIME",
  },
  "PRIMARY KEY": {
    pKName: "errorId",
  },
};

const ErrLog = new mysqlHandler.createTable(errLogTable, "errLogs");

module.exports = ErrLog;
