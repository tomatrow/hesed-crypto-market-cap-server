const { fetchMarketCap } = require("../functions/market-cap/fetch-market-cap")

;(async function() {
    const result = await fetchMarketCap()
    console.log({ result })
})()

