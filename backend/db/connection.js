const oracledb = require("oracledb");

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const dbConfig = {
  user: "dbs501_253v1a06",
  password: "18691891",
  connectString: "myoracle12c.senecacollege.ca:1521/oracle12c"
};

async function initialize() {
  try {
    await oracledb.createPool(dbConfig);
    console.log("Oracle DB connected ");
  } catch (err) {
    console.error("Database connection failed ", err);
  }
}

module.exports = {
  initialize,
  getConnection: () => oracledb.getConnection()
};
