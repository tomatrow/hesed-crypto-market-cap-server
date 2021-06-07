const { fetchMarketCap, extractData } = require('../functions/market-cap/fetch-market-cap');

;(async function() {
    console.log({ fetchMarketCap, extractData } )
    const data = await fetchMarketCap()
    console.log({ data })
    
    const result = extractData(data)
    console.log({ result })
})()

