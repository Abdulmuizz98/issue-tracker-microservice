const mongoose = require("mongoose");
const nodeEnv = process.env.NODE_ENV;
const dbUri =
  nodeEnv && nodeEnv === "test"
    ? process.env.TEST_MONGO_URI
    : process.env.MONGO_URI;

const connection = mongoose.connect(dbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.export = connection;
