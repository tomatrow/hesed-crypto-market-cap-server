const { fetchMarketCap } = require("./fetch-market-cap")

exports.handler = async function () {
    try {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE"
            },
            body: JSON.stringify(await fetchMarketCap())
        }
    } catch (error) {
        console.error(error)
        return {
            statusCode: 500
        }
    }
}
