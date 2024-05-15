"use strict";
require("../connection.js");
const { Project } = require("../models/projects.js");

module.exports = function (app) {
  app
    .route("/api/issues/:project")

    .get(async function (req, res) {
      let project = req.params.project;

      if ("open" in req.query) req.query.open = req.query.open === "true";

      try {
        const projectDoc = await Project.findOne({ project: project });
        if (!projectDoc) {
          return res.json({ error: "project not found" });
        }
        const issues = projectDoc.issues.filter((issue) => {
          for (let key in req.query) {
            if (issue[key] !== req.query[key]) return false;
          }
          return true;
        });

        return res.json(issues);
      } catch (err) {
        res.json({ error: err.message });
      }
    })

    .post(async function (req, res) {
      let project = req.params.project;

      if (
        !req.body.issue_title ||
        !req.body.issue_text ||
        !req.body.created_by
      ) {
        return res.json({ error: "required field(s) missing" });
      }

      try {
        let projectDoc = await Project.findOne({ project: project });
        if (!projectDoc) {
          projectDoc = new Project({ project: project });
        }
        projectDoc.issues.push(req.body);
        projectDoc = await projectDoc.save();
        const issueDoc = projectDoc.issues[projectDoc.issues.length - 1];
        return res.json(issueDoc);
      } catch (err) {
        res.json({ error: err.message });
      }
    })

    .put(async function (req, res) {
      let project = req.params.project;
      const { _id, ...payload } = req.body;

      if (!_id) return res.json({ error: "missing _id" });

      if (Object.keys(payload).length === 0)
        // check if object is empty
        return res.json({ error: "no update field(s) sent", _id });

      for (let key in payload) {
        if (!payload[key]) delete payload[key];
      }
      payload.updated_on = new Date();

      if (payload.open === "true" || payload.open === "false")
        payload.open = payload.open === "true";

      try {
        const projectDoc = await Project.findOne({ project: project });

        if (!projectDoc) return res.json({ error: "project not found" });

        const issueDoc = projectDoc.issues.find(
          (issue) => issue._id.toString() === _id
        );

        if (!issueDoc)
          return res.json({ error: "issue not found invalid _id" });

        Object.assign(issueDoc, payload);

        await projectDoc.save();

        return res.json({ result: "successfully updated", _id });
      } catch (err) {
        return res.json({ error: "could not update", _id });
      }
    })

    .delete(async function (req, res) {
      let project = req.params.project;
      const _id = req.body._id;

      if (!_id) return res.json({ error: "missing _id" });

      try {
        const projectDoc = await Project.findOne({ project: project });

        if (!projectDoc) return res.json({ error: "project not found" });

        const issueIndex = projectDoc.issues.findIndex(
          (issue) => issue._id.toString() === _id
        );

        if (issueIndex === -1)
          return res.json({ error: "issue not found invalid _id" });

        projectDoc.issues.splice(issueIndex, 1)[0];
        await projectDoc.save();

        return res.json({ result: "successfully deleted", _id });
      } catch (err) {
        return res.json({ error: "could not delete", _id });
      }
    });
};
