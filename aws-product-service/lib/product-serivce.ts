import { Construct } from "constructs"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as iam from "aws-cdk-lib/aws-iam"

const lambdaConfiguration = {
  runtime: lambda.Runtime.NODEJS_18_X,
  code: lambda.Code.fromAsset("resources"),
  environment: {
    PRODUCTS_TABLE: "RSS_Products",
    STOCKS_TABLE: "RSS_Stocks",
  },
}

export class ProductService extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id)

    const getProductsList = new lambda.Function(this, "GetProductsListFunction", {
      ...lambdaConfiguration,
      handler: "getProductsList.main",
    })

    const getProductById = new lambda.Function(this, "GetProductByIdFunction", {
      ...lambdaConfiguration,
      handler: "getProductById.main",
    })

    const createProduct = new lambda.Function(this, "CreateProductFunction", {
      ...lambdaConfiguration,
      handler: "createProduct.main",
    })

    const dynamoDBPolicy = new iam.PolicyStatement({
      actions: ["dynamodb:Scan", "dynamodb:Query", "dynamodb:GetItem", "dynamodb:PutItem"],
      resources: ["*"],
    })
    getProductById.addToRolePolicy(dynamoDBPolicy)
    getProductsList.addToRolePolicy(dynamoDBPolicy)
    createProduct.addToRolePolicy(dynamoDBPolicy)

    const api = new apigateway.RestApi(this, "products-api", {
      restApiName: "Products Service",
      description: "This service serves products.",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["*"],
      },
    })

    
    // /products route
    const productsResource = api.root.addResource("products")

    const getProductsIntegration = new apigateway.LambdaIntegration(getProductsList)
    const createProductIntergration = new apigateway.LambdaIntegration(createProduct)

    productsResource.addMethod("GET", getProductsIntegration)
    productsResource.addMethod("POST", createProductIntergration)

    // /products/{id} route
    const productsByIdResource = productsResource.addResource("{id}")
    const getProductByIdIntegration = new apigateway.LambdaIntegration(getProductById)

    productsByIdResource.addMethod("GET", getProductByIdIntegration)
  }
}
