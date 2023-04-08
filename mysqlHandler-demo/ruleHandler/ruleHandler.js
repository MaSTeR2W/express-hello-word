const { error } = require("./../errorHandler/errorHandler");
const { getType } = require("./../auxiliaryFunctions");

exports.extractRule = (columns, tableName) => {
  const insertRule = {},
    updateRule = {},
    whereRule = {},
    tableCols = [];
  const fields = Object.keys(columns);
  const configWords = [
    "PRIMARY KEY",
    "CONSTRAINT",
    "REFERENCES",
    "INDEX",
    "FOREIGN KEY",
  ];

  // عند إدخال مفتاح عحمي يجب التحقق مما اذا كان موجودا في المصدر
  // التحقق من نوع البيانات المدخلة
  for (let i = 0; i < fields.length; i++) {
    // create sql field to be extracted later
    const field = columns[fields[i]];
    // if the property is config word
    if (configWords.includes(fields[i].toUpperCase())) {
      // if primary Key

      // here variable field is as following: {PRIMARY KEY: "COLUMN NAME"}
      if (/PRIMARY KEY/i.test(fields[i])) {
        if (getType(field) == "array") {
          for (let x = 0; x < field.length; x++) {
            if (!fields.includes(field[x].pkName))
              throw new error(
                1100,
                `Error in ${fields[i]} field in ${tableName} table. The column provided (${field[x].pKName}) does not exist in this table.`
              );
          }
        } else if (!fields.includes(field.pKName))
          throw new error(
            1100,
            `Error in ${fields[i]} field in ${tableName} table. The column provided (${field.pKName}) does not exist in this table.`
          );

        field.sql = `PRIMARY KEY (${field.pKName})`;
      }
      // if Constraint: array
      if (/CONSTRAINT/i.test(fields[i])) {
        let constraintSql = "";
        const constraints = field.crts;
        for (let j = 0; j < constraints.length; j++) {
          // foreign key name
          // يجب التحقق من فردية الاسم
          constraintSql += `CONSTRAINT ${tableName}_${constraints[j].fKCol}_${constraints[j].references.table} `;

          // foreign key column
          // يجب التحقق من أن المصدر تم إنشاءه لكن ليس هنا إنما في tableHandler.
          // عند إدخال مفتاح عحمي يجب التحقق مما اذا كان موجودا في المصدر

          constraintSql += "FOREIGN KEY (" + constraints[j].fKCol + ") ";

          // references may be an array of object but for now it is object
          constraintSql +=
            "REFERENCES " + constraints[j].references.table + " ";
          constraintSql += "(" + constraints[j].references.col + ")";
          j + 1 < constraints.length && (constraintSql += ", ");
        }
        field.sql = constraintSql;
      }
      // if Index  //done
      if (/INDEX/i.test(fields[i])) {
        let iSql = "";
        const indexers = field.indexers;
        // يجب التحقق من كون الحقل من النوع المصفوفي
        for (let j = 0; j < indexers.length; j++) {
          // unique index name
          iSql += `${indexers[j].iType || ""} INDEX ${indexers[j].iName} `;
          // unique index column
          // check if the unique index column is exist or not

          if (getType(indexers[j].iCol) == "array") {
            for (let x = 0; x < indexers[j].iCol.length; x++)
              if (!fields.includes(indexers[j].iCol[x]))
                throw new error(
                  1101,
                  `Error in ${fields[i]} field in ${tableName} table. The column provided (${indexers[j].iCol[x]}) to be index does not exist in this table.`
                );
          } else if (!fields.includes(indexers[j].iCol))
            throw new error(
              1101,
              `Error in ${fields[i]} field in ${tableName} table. The column provided (${indexers[j].iCol}) to be index does not exist in this table.`
            );

          iSql += `(${indexers[j].iCol})`;
          j + 1 < indexers.length && (iSql += ", ");
        }
        field.sql = iSql;
      }
    } else {
      tableCols.push(fields[i]);

      const as = field.getProp("AS");
      // if the property is not config word
      // type string , number , array , object
      const type = field.getProp("TYPE");
      // MySQl data type like INT , VARCHAR() ...etc.
      const dataType = field.getProp("DATATYPE");

      const autoIncrement = field.getProp("AUTOINCREMENT");

      const unsigned = field.getProp("unsigned");

      const notNull = field.getProp("notNull");

      const unique = field.getProp("unique");

      const validate = field.getProp("validate");

      const _default = field.getProp("default");

      if (!type)
        throw new error(
          1102,
          `Error in ${fields[i]} field in ${tableName} table. The value of the type property must be not a falsy value`
        );

      if (
        !["string", "number", "array", "object", "date", "boolean"].includes(
          type
        )
      )
        throw new error(
          1103,
          `Error in ${fields[i]} field in ${tableName} table. The value type of the property should be (string or number or array or object or date). The recieved type is ${type}`
        );

      if (!dataType)
        throw new error(
          1104,
          `Error in ${fields[i]} field in ${tableName} table. The value of the dataType propery must be not a falsy value. The property value is ${dataType}`
        );

      insertRule[fields[i]] = {};
      updateRule[fields[i]] = {};
      whereRule[fields[i]] = {};

      // if the col is auto generate column
      if (autoIncrement) {
        field.sql = "" + dataType;

        unsigned && (field.sql += " UNSIGNED");
        notNull && (field.sql += " NOT NULL");

        field.sql += " AUTO_INCREMENT";

        insertRule[fields[i]].autoIncrement = updateRule[
          fields[i]
        ].autoIncrement = true;
        whereRule[fields[i]].type = type;

        continue;
      }

      if (as) {
        field.sql = `${dataType} GENERATED ALWAYS AS ${as} STORED`;
        insertRule[fields[i]].as = updateRule[fields[i]].as = true;
        // where
        continue;
      }

      field.sql = "" + dataType;

      insertRule[fields[i]].type =
        updateRule[fields[i]].type =
        whereRule[fields[i]].type =
          type;

      if (validate) {
        if (typeof validate !== "function")
          throw new error(
            1105,
            `Error in ${
              fields[i]
            } field in ${tableName} table. The type of validate property must be a function but the recieved type is ${typeof validate}`
          );

        insertRule[fields[i]].validate =
          updateRule[fields[i]].validate =
          whereRule[fields[i]].validate =
            validate;
      }
      // ==========================================
      if (["number", "string"].includes(field.type)) {
        if (field.type === "string") {
          // check if it is a number
          if (field.maxLength)
            insertRule[fields[i]].maxLength =
              updateRule[fields[i]].maxLength =
              whereRule[fields[i]].maxLength =
                field.maxLength;
          if (field.minLength)
            insertRule[fields[i]].minLength =
              updateRule[fields[i]].minLength =
              whereRule[fields[i]].minLength =
                field.minLength;

          if (field.trim) {
            if (typeof field.trim !== "boolean")
              throw new error(
                1106,
                `Error in ${
                  fields[i]
                } field in ${tableName} table. The type of trim property must be boolean, recieved type is ${typeof field.trim}`
              );
            // select in case of ware
            insertRule[fields[i]].trim =
              updateRule[fields[i]].trim =
              whereRule[fields[i]].trim =
                field.trim;
          }
        }

        if (field.type === "number") {
          if (field.biggestNum)
            insertRule[fields[i]].biggestNum =
              updateRule[fields[i]].biggestNum =
              whereRule[fields[i]].biggestNum =
                field.biggestNum;
          if (field.lowestNum)
            insertRule[fields[i]].lowestNum =
              updateRule[fields[i]].lowestNum =
              whereRule[fields[i]].lowestNum =
                field.lowestNum;
          if (unsigned) {
            insertRule[fields[i]].unsigned =
              updateRule[fields[i]].unsigned =
              whereRule[fields[i]].unsigned =
                unsigned;
            field.sql += " UNSIGNED";
          }
        }

        if (unique) {
          const index = columns.getProp("Index");
          if (index) {
            index.indexers.push({
              iName: `${tableName}_${fields[i]}_index`,
              iCol: fields[i],
            });
          } else {
            columns.index = {
              indexers: [
                {
                  iName: `${tableName}_${fields[i]}_index`,
                  iCol: fields[i],
                },
              ],
            };
            fields.push("index");
          }
          // التحقق من نوع البيانات مفروض يكون حرفي
          insertRule[fields[i]].unique = updateRule[fields[i]].unique =
            field.unique;
        }

        if (typeof _default != "undefined") {
          // just for string and array
          //التحقق من أنه القيمة الافتراضية مطابقة للشروط
          if (typeof field.default !== field.type)
            throw new error(
              1107,
              `Error in ${
                fields[i]
              } field in ${tableName} table. The type of default property is not the same as specified in type field, the recieved type is: ${typeof field.default} while the type that has been specified is: ${type}`
            );
          insertRule[fields[i]].default = _default;
          field.sql +=
            field.type == "string"
              ? ` DEFAULT "${field.default}"`
              : ` DEFAULT ${field.default}`;
        }
      } else if (["array", "object"].includes(type)) {
        if (!field.maxLength)
          throw new error(
            1108,
            `Error: maxLength property should be specified when using array or object type`
          );
        insertRule[fields[i]].maxLength = updateRule[fields[i]].maxLength =
          field.maxLength;
      }

      if (notNull) {
        insertRule[fields[i]].notNull = updateRule[fields[i]].notNull = notNull;
        field.sql += " NOT NULL";
      }
    }
  }
  return { insertRule, updateRule, whereRule, tableCols };
};
