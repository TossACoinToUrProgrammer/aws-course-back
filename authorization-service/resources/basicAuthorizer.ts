import { APIGatewayTokenAuthorizerEvent, APIGatewayTokenAuthorizerHandler } from "aws-lambda"

const login = process.env.GH_LOGIN!
const password = process.env.PASSWORD!

export const handler: APIGatewayTokenAuthorizerHandler = async (event: APIGatewayTokenAuthorizerEvent) => {
  try {
    const authToken = event.authorizationToken
    console.log("token", authToken)

    if (!authToken || !authToken.startsWith("Basic ")) {
      throw new Error("Unauthorized")
    }

    const token = authToken.replace("Basic ", "")
    const decoded = atob(token)
    
    if (decoded !== `${login}:${password}`) {
      return generatePolicy("user", "Deny", event.methodArn)
    } else {
      return generatePolicy("user", "Allow", event.methodArn)
    }
  } catch (error) {
    console.error("Error:", error)
    throw new Error("Unauthorized")
  }
}

function generatePolicy(principalId: string, effect: string, resource: string) {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  }
}
