import "dotenv/config"
import * as http from "http"
import axios from "axios"
import { getRequestBody } from "./utils/getRequestBody"
import { getPathname } from "./utils/getPathname"

const port = process.env.PORT || 4000

const cartUrl = process.env.CART_API

const urls = {
  cart: cartUrl,
  import: "https://n5bz2zlq3b.execute-api.us-east-1.amazonaws.com/prod", //?name=testFile1.csv
  products: "https://xtvcbfsgk5.execute-api.us-east-1.amazonaws.com/prod",
}

const server = http.createServer()
server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})

server.on("request", async (req: http.IncomingMessage, res: http.ServerResponse) => {
  const body = await getRequestBody(req)
  const pathname = getPathname(req.url)
  console.log("pathname", pathname)

  //@ts-ignore
  const recipentURL = urls[pathname]

  if (recipentURL) {
    const axiosConfig = {
      method: req.method,
      url: `${recipentURL}${req.url}`,
      ...(body && { data: body }),
    }

    try {
      const response = await axios(axiosConfig)
      res.writeHead(response.status, { "Content-Type": "application/json" })
      if (pathname === "products") {
        return res.end(JSON.stringify(response.data))
      } else {
        return res.end(JSON.stringify(response.data.data))
      }
    } catch (error: any) {
      console.log("error", error)
      if (error.response) {
        const { status, data } = error.response

        res.writeHead(status, { "Content-Type": "application/json" })
        res.end(JSON.stringify(data))
      } else {
        res.writeHead(500, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: error.message }))
      }
    }
  } else {
    res.writeHead(502, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ message: "Request cannot be processed" }))
  }
})
