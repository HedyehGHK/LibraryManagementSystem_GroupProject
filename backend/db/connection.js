// Import the OracleDB library so we can connect to the Oracle database
const oracledb = require("oracledb");
// Return query results as JavaScript objects instead of arrays
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
// Database connection settings (same info used in SQL Developer connection)
const dbConfig = {
  user: "dbs501_253v1a06",
  password: "18691891",
  connectString: "myoracle12c.senecacollege.ca:1521/oracle12c"
}; // host : port / serviceName
   // This info is taken from SQL Developer connection details


// Create a connection pool when the server starts
// A connection pool keeps several ready-to-use database connections
// This makes the API faster and prevents reconnecting every time
async function initialize() {
  try {
    await oracledb.createPool(dbConfig);
    console.log("Oracle DB connected ");
  } catch (err) {
    console.error("Database connection failed ", err);
  }
}
// This function gives each route one connection from the pool
// Routes use this to run SQL queries


module.exports = {  ///We export initialize to create the pool at server startup, 
                    // and getConnection so each route can get a database connection when needed.
  initialize,
  getConnection: () => oracledb.getConnection()
};
