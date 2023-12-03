function createResponse(status: number, body: string | object) {
  let result = typeof body === "string" ? body : JSON.stringify(body)

  return {
    statusCode: status,
    headers: {
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
    body: result,
  }
}

export default createResponse
