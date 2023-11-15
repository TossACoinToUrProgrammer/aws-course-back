const getHeaders = (options = {}) => ({
  "Access-Control-Allow-Credentials": true,
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
  ...options,
})

module.exports = getHeaders
