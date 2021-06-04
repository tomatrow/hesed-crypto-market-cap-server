const fetchMarketCap = require("./fetch-market-cap")

exports.handler = async function() {
    try {
        return {
            statusCode: 200,
            body: JSON.stringify(await fetchMarketCap())
        }
    } catch (error) {
        console.error(error)
        return {
            statusCode: 500
        }
    }
}