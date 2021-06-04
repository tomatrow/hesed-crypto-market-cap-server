const faunadb = require("faunadb")
const axios = require("axios")
const parseISO = require('date-fns/parseISO')
const differenceInMinutes = require('date-fns/differenceInMinutes')
const formatISO = require('date-fns/formatISO')

const q = faunadb.query

function createCoinMarketCapApi(debug = false) {
    const prefix = debug ? "MOCK_" : ""

    return axios.create({
        baseURL: `https://${process.env[prefix + "COIN_API_BASE"]}/v1/`,
        timeout: 1000,
        headers: {
            "X-CMC_PRO_API_KEY": process.env[prefix + "COIN_MARKET_CAP_KEY"]
        }
    })
}

const coinMarketCapApi = createCoinMarketCapApi(false)

function shouldUpdate(timestamp) {
    if (!timestamp) return true 
    const date = parseISO(timestamp)
    return differenceInMinutes(date, new Date()) > 15 
}

exports.fetchMarketCap = async function () {
    const client = new faunadb.Client({
        secret: process.env.FAUNADB_SERVER_SECRET
    })

    const ref = q.Ref(q.Collection("default"), "0")
    const { data } = await client.query(q.Get(ref))
    
    if (shouldUpdate(data.lastRequestTimestamp)) {
        console.log("Fetching new data...")
        const response = await coinMarketCapApi.get(`/global-metrics/quotes/latest`)
        data.cachedResponseData = response.data
        data.lastRequestTimestamp = formatISO(new Date())
        console.log("Fetched...", { data })
        await client.query(
            q.Update(ref, {
                data
            })
        )
    } else {
        console.log("Using cached response...")
    }

    return data.cachedResponseData
}