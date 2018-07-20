module.exports = function () {
  const mongoose = require('mongoose');
  const db = mongoose.connect('mongodb://localhost:27017/blog', { useNewUrlParser: true });
  return db;
}
