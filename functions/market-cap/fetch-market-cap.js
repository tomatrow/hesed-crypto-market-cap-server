const faunadb = require("faunadb")
const axios = require("axios")
const parseISO = require("date-fns/parseISO")
const differenceInMinutes = require("date-fns/differenceInMinutes")
const formatISO = require("date-fns/formatISO")
const numeral = require("numeral")
const CoinGecko = require('coingecko-api');

const q = faunadb.query

function createCoinMarketCapApi(debug = false) {
    return axios.create({
        baseURL: `https://${process.env.COIN_API_BASE}/v1/`,
        timeout: 5000,
        headers: {
            "X-CMC_PRO_API_KEY": process.env.COIN_MARKET_CAP_KEY
        }
    })
}

const CoinGeckoClient = new CoinGecko();
const coinMarketCapApi = createCoinMarketCapApi()
exports.coinMarketCapApi = coinMarketCapApi

function shouldUpdate(timestamp) {
    if (!timestamp) return true
    const date = parseISO(timestamp)
    return differenceInMinutes(new Date(), date) > 15
}

exports.fetchMarketCap = async function () {
    const client = new faunadb.Client({
        secret: process.env.FAUNADB_SERVER_SECRET
    })

    const ref = q.Ref(q.Collection("default"), "0")
    const { data } = await client.query(q.Get(ref))

    if (shouldUpdate(data.lastRequestTimestamp)) {
        console.log("Fetching new data...")

        const coinGeckoResponse = await CoinGeckoClient.global()
        data.coinGeckoCached = coinGeckoResponse.data.data
    
        const coinMarketCapResponse = await coinMarketCapApi.get(`/global-metrics/quotes/latest`)
        data.coinMarketCapCached = coinMarketCapResponse.data.data
        data.lastRequestTimestamp = formatISO(new Date())

        await client.query(
            q.Update(ref, {
                data
            })
        )
    } else {
        console.log("Using cached response...", data.lastRequestTimestamp, formatISO(new Date()))
    }

    return {
        coinMarketCap: data.coinMarketCapCached,
        coinGecko: data.coinGeckoCached
    }
}

exports.extractData = function (data) {
    const { total_market_cap } = data.coinMarketCap.quote.USD
    const { market_cap_change_percentage_24h_usd } = data.coinGecko
    return {
        marketCap: "$" + numeral(Number(total_market_cap)).format("0.00a").toUpperCase(),
        percentChange:
            numeral(Number(market_cap_change_percentage_24h_usd)).format("0.00") + "%",
        increase: market_cap_change_percentage_24h_usd > 0
    }
}