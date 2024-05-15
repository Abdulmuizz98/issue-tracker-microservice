const mongoose = require("mongoose");

const issuesSchema = new mongoose.Schema({
  issue_title: { type: String, required: true },
  issue_text: { type: String, required: true },
  created_by: { type: String, required: true },
  assigned_to: { type: String, default: "" },
  status_text: { type: String, default: "" },
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now },
  open: { type: Boolean, default: true },
});

const projectSchema = new mongoose.Schema({
  project: { type: String, required: true },
  issues: [issuesSchema],
});

const Project = mongoose.model("Project", projectSchema);
// const Issue = mongoose.model("Issue", issuesSchema);

exports.Project = Project;
// exports.Issue = Issue;
