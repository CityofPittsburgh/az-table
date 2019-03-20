const express = require('express')
const router = express.Router()
const checkToken = require('../token')
const fetch = require('node-fetch')
const dt = require('node-json-transform').DataTransform
const azure = require('azure-storage')
const tableService = azure.createTableService()
const models = require('../models/activeDirectory')
global.Headers = fetch.Headers

// get events generated from outside PA
router.get('/riskEvents',
    async function (req, res) {
        const valid = (checkToken(req.token))
        if (valid == true) {
            const events = []
            const query = new azure.TableQuery()
                .where('state ne ?', 'Pennsylvania')
            await callAPI(null).then(() => {
                res.status(200).send(events)
            })
            async function callAPI(page) {
                const response = await new Promise(async function (resolve, reject) {
                    await tableService.queryEntities('adEvents', query, page, async (error, result, response) => {
                        if (!error) {
                            resolve(result)
                        } else {
                            console.log(error)
                            res.status(500).send()
                            reject(error)
                        }
                    })
                })
                await events.push(...dt(response, models.event).transform())
                if (response.continuationToken) {
                    await callAPI(response.continuationToken)
                } else return
            }

        } else res.status(403).end()
    }
)

// returns events older than 48 hours
router.get('/toDelete',
    async function (req, res) {
        const valid = (checkToken(req.token))
        if (valid == true) {
            const events = []
            const date = new Date
            await date.setHours(date.getHours() - 48)
            const query = new azure.TableQuery()
                .where('Timestamp le ?', date)
            await callAPI(null).then(() => {
                res.status(200).send(events)
            })
            async function callAPI(page) {
                const response = await new Promise(async function (resolve, reject) {
                    await tableService.queryEntities('adEvents', query, page, async (error, result, response) => {
                        if (!error) {
                            resolve(result)
                        } else {
                            console.log(error)
                            res.status(500).send()
                            reject(error)
                        }
                    })
                })
                await events.push(...dt(response, models.toDelete).transform())
                if (response.continuationToken) {
                    await callAPI(response.continuationToken)
                } else return
            }

        } else res.status(403).end()
    }
)


module.exports = router