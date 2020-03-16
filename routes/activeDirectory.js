const express = require("express");
const router = express.Router();
const dt = require("node-json-transform").DataTransform;
const azure = require("azure-storage");
const tableService = azure.createTableService();
const models = require("../models/activeDirectory");

// get events generated from outside PA
router.get("/riskEvents", async (req, res) => {
  const events = [];
  const query = new azure.TableQuery().where("state ne ? or state ne ?", "Pennsylvania", "pennsylvania");
  await callAPI(null).then(() => {
    res.status(200).send(events);
  });

  async function callAPI(page) {
    const response = await new Promise(async function(resolve, reject) {
      await tableService.queryEntities(
        "adEvents",
        query,
        page,
        async (error, result, response) => {
          if (!error) {
            resolve(result);
          } else {
            res.status(500).send();
            reject(error);
          }
        }
      );
    });
    await events.push(...dt(response, models.event).transform());
    if (response.continuationToken) {
      await callAPI(response.continuationToken);
    } else return;
  }
});

// returns events older than 48 hours
router.get("/toDelete", async (req, res) => {
  const events = [];
  const date = new Date();
  await date.setHours(date.getHours() - 48);
  const query = new azure.TableQuery().where("Timestamp le ?", date);
  await callAPI(null).then(() => {
    res.status(200).send(events);
  });
  async function callAPI(page) {
    const response = await new Promise(async function(resolve, reject) {
      await tableService.queryEntities(
        "adEvents",
        query,
        page,
        async (error, result, response) => {
          if (!error) {
            resolve(result);
          } else {
            res.status(500).send();
            reject(error);
          }
        }
      );
    });
    await events.push(...dt(response, models.toDelete).transform());
    if (response.continuationToken) {
      await callAPI(response.continuationToken);
    } else return;
  }
});

module.exports = router;
