const mysqlHandler = require("./../mysqlHandler-demo/mysqlHandler");

const imageTable = {
  imageId: {
    type: "number",
    dataType: "INT",
    unsigned: true,
    autoIncrement: true,
  },
  productId: {
    type: "number",
    dataType: "MEDIUMINT",
    unsigned: true,
  },
  imageUrl: {
    type: "string",
    dataType: "VARCHAR(300)",
  },
  isMain: {
    type: "boolean",
    dataType: "BOOLEAN",
  },
  "PRIMARY KEY": {
    pKName: "imageId",
  },
  index: {
    indexers: [
      {
        iName: "ImagesOfProducts_index",
        iCol: "productId",
      },
    ],
  },
};

const Image = new mysqlHandler.createTable(imageTable, "images");

module.exports = Image;
