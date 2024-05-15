const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");
const mongoose = require("mongoose");
const { before, after, afterEach, suite, test } = require("mocha");
const { Project } = require("../models/projects");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  // Connect to the database before running any tests.
  this.timeout(10000);
  before(async () => {
    // await mongoose.connection.close();
    // const testDbUri = process.env.TEST_MONGO_URI;
    // await mongoose.connect(testDbUri, {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    // });
    await mongoose.connection.dropDatabase();
    // await connection.connection.db.dropDatabase();
    // await mongoose.connection.db.dropDatabase();
  });

  // Disconnect from the database after running all the tests.
  after(async () => {
    await mongoose.connection.close();
  });

  // Delete all documents from the database before each test.
  afterEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  //   this.timeout(5000);
  const seedData = [
    {
      project: "test",
      issues: [
        {
          issue_title: "Title 1",
          issue_text: "Unit Test",
          created_by: "John",
          assigned_to: "Doe",
          status_text: "In QA",
          open: true,
        },
        {
          issue_title: "Title 2",
          issue_text: "Integration Test",
          created_by: "Foo",
          assigned_to: "Bar",
          status_text: "In Stage",
          open: true,
        },
        {
          issue_title: "Title 3",
          issue_text: "Functional Test",
          created_by: "John",
          assigned_to: "Doe",
          status_text: "In Stage",
          open: false,
        },
        {
          issue_title: "Title 4",
          issue_text: "End-to-End Test",
          created_by: "Foo",
          assigned_to: "Bar",
          status_text: "In Stage",
          open: false,
        },
      ],
    },
  ];
  suite("POST Method Tests", function () {
    //#1
    test("Create an issue with every field: POST request to /api/issues/{project}", async () => {
      const postData = {
        issue_title: "Title",
        issue_text: "text",
        created_by: "Functional Test - Every field",
        assigned_to: "Chai and Mocha",
        status_text: "In QA",
      };
      const res = await chai
        .request(server)
        .keepOpen()
        .post("/api/issues/test")
        .send(postData);

      assert.equal(res.status, 200);
      assert.equal(res.body.issue_title, "Title");
      assert.equal(res.body.issue_text, "text");
      assert.equal(res.body.created_by, "Functional Test - Every field");
      assert.equal(res.body.assigned_to, "Chai and Mocha");
      assert.equal(res.body.status_text, "In QA");
      assert.equal(res.body.open, true);

      // Verify that data is saved to the database.
      const doc = await Project.findOne({ project: "test" });
      assert.isNotNull(doc);
      assert.equal(doc.issues.length, 1);
      assert.equal(doc.issues[0].issue_title, "Title");
    });

    //#2
    test("Create an issue with only required fields: POST request to /api/issues/{project}", async () => {
      const postData = {
        issue_title: "Title",
        issue_text: "text",
        created_by: "Functional Test - Only required fields",
      };
      const res = await chai
        .request(server)
        .keepOpen()
        .post("/api/issues/test")
        .send(postData);

      assert.equal(res.status, 200);
      assert.equal(res.body.issue_title, "Title");
      assert.equal(res.body.issue_text, "text");
      assert.equal(
        res.body.created_by,
        "Functional Test - Only required fields"
      );

      // Verify that data is saved to the database.
      const doc = await Project.findOne({ project: "test" });
      assert.isNotNull(doc);
      assert.equal(doc.issues.length, 1);
      assert.equal(doc.issues[0].issue_title, "Title");
    });
    //#3
    test("Create an issue with missing required fields: POST request to /api/issues/{project}", async () => {
      const postData = {
        issue_title: "Title",
      };
      const res = await chai
        .request(server)
        .keepOpen()
        .post("/api/issues/test")
        .send(postData);

      assert.equal(res.status, 200);
      assert.equal(res.body.error, "required field(s) missing");

      // Verify that data is not saved to the database.
      const doc = await Project.findOne({ project: "test" });
      assert.isNull(doc);
    });
  });

  suite("GET Method Tests", function () {
    //#4
    test("View issues on a project: GET request to /api/issues/{project}", async () => {
      await Project.insertMany(seedData);

      const res = await chai.request(server).keepOpen().get("/api/issues/test");

      assert.equal(res.status, 200);
      assert.isArray(res.body);
      assert.equal(res.body.length, 4);
      assert.equal(res.body[0].issue_title, "Title 1");
      assert.equal(res.body[1].issue_title, "Title 2");
    });
    //#5
    test("View issues on a project with one filter: GET request to /api/issues/{project}", async () => {
      await Project.insertMany(seedData);

      const res = await chai
        .request(server)
        .keepOpen()
        .get("/api/issues/test?open=true");

      assert.equal(res.status, 200);
      assert.isArray(res.body);
      assert.equal(res.body.length, 2);
      assert.equal(res.body[0].issue_title, "Title 1");
      assert.equal(res.body[1].issue_title, "Title 2");
    });
    //#6
    test("View issues on a project with multiple filters: GET request to /api/issues/{project}", async () => {
      await Project.insertMany(seedData);

      const res = await chai
        .request(server)
        .keepOpen()
        .get("/api/issues/test?created_by=Foo&assigned_to=Bar");

      assert.equal(res.status, 200);
      assert.isArray(res.body);
      assert.equal(res.body.length, 2);
      assert.equal(res.body[0].issue_title, "Title 2");
      assert.equal(res.body[1].issue_title, "Title 4");
    });
  });

  suite("PUT Method Tests", function () {
    //#7
    test("Update one field on an issue: PUT request to /api/issues/{project}", async () => {
      const docs = await Project.insertMany(seedData);
      const _id = docs[0].issues[0]._id.toString();

      const res = await chai
        .request(server)
        .keepOpen()
        .put("/api/issues/test")
        .send({
          _id,
          issue_title: "Updated Title",
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.issue_title, "Updated Title");
      assert.equal(res.body.issue_text, "Unit Test");

      // Verify that data is saved to the database.
      const projectDoc = await Project.findOne({ project: "test" });
      assert.equal(projectDoc.issues[0]._id, _id);
      assert.equal(projectDoc.issues[0].issue_title, "Updated Title");
    });
    //#8
    test("Update multiple fields on an issue: PUT request to /api/issues/{project}", async () => {
      const docs = await Project.insertMany(seedData);
      const _id = docs[0].issues[0]._id.toString();

      const res = await chai
        .request(server)
        .keepOpen()
        .put("/api/issues/test")
        .send({
          _id,
          issue_title: "Updated Title",
          issue_text: "Updated Text",
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.issue_title, "Updated Title");
      assert.equal(res.body.issue_text, "Updated Text");

      // Verify that data is saved to the database.
      const projectDoc = await Project.findOne({ project: "test" });
      assert.equal(projectDoc.issues[0]._id, _id);
      assert.equal(projectDoc.issues[0].issue_title, "Updated Title");
      assert.equal(projectDoc.issues[0].issue_text, "Updated Text");
    });
    //#9
    test("Update an issue with missing _id: PUT request to /api/issues/{project}", async () => {
      await Project.insertMany(seedData);

      const res = await chai
        .request(server)
        .keepOpen()
        .put("/api/issues/test")
        .send({
          issue_title: "Updated Title",
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.error, "missing _id");
    });
    //#10
    test("Update an issue with no fields to update: PUT request to /api/issues/{project}", async () => {
      const docs = await Project.insertMany(seedData);
      const _id = docs[0].issues[0]._id.toString();

      const res = await chai
        .request(server)
        .keepOpen()
        .put("/api/issues/test")
        .send({
          _id,
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.error, "no update field(s) sent");
    });
    //#11
    test("Update an issue with an invalid _id: PUT request to /api/issues/{project}", async () => {
      await Project.insertMany(seedData);

      const res = await chai
        .request(server)
        .keepOpen()
        .put("/api/issues/test")
        .send({
          _id: "invalid_id",
          issue_title: "Updated Title",
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.error, "issue not found invalid _id");
    });
  });

  suite("DELETE Method Tests", function () {
    //#12
    test("Delete an issue: DELETE request to /api/issues/{project}", async () => {
      const docs = await Project.insertMany(seedData);
      const _id = docs[0].issues[0]._id.toString();

      const res = await chai
        .request(server)
        .keepOpen()
        .delete("/api/issues/test")
        .send({
          _id,
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.issue_title, "Title 1");
      assert.equal(res.body.issue_text, "Unit Test");

      // Verify that the issue data is deleted from the database.
      const projectDoc = await Project.findOne({ project: "test" });
      assert.equal(projectDoc.issues.length, 3);
      assert.notEqual(projectDoc.issues[0]._id, _id);
    });
    //#13
    test("Delete an issue with an invalid _id: DELETE request to /api/issues/{project}", async () => {
      await Project.insertMany(seedData);

      const res = await chai
        .request(server)
        .keepOpen()
        .delete("/api/issues/test")
        .send({
          _id: "invalid_id",
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.error, "issue not found invalid _id");
    });
    //#14
    test("Delete an issue with missing _id: DELETE request to /api/issues/{project}", async () => {
      await Project.insertMany(seedData);

      const res = await chai
        .request(server)
        .keepOpen()
        .delete("/api/issues/test")
        .send({});

      assert.equal(res.status, 200);
      assert.equal(res.body.error, "missing _id");
    });
  });
});
