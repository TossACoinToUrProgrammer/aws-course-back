import { Construct } from "constructs"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as iam from "aws-cdk-lib/aws-iam"
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Duration } from "aws-cdk-lib";
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

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

    const catalogBatchProcess  = new lambda.Function(this, "CatalogBatchProcessFunction", {
      ...lambdaConfiguration,
      handler: "catalogBatchProcess.main",
    })

    const queue = new sqs.Queue(this, 'CatalogItemsQueue', {
      queueName: 'catalogItemsQueue',
      retentionPeriod: Duration.days(14) 
    });
    catalogBatchProcess.addEventSource(new lambdaEventSources.SqsEventSource(queue,{
      batchSize: 5
    }));
    catalogBatchProcess.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
    )

    const topic = new sns.Topic(this, 'CreateProductTopic', {
      topicName: 'createProductTopic',
      displayName: 'Product Creation Notifications'
    });

    // topic.addSubscription(new snsSubscriptions.EmailSubscription('xscorpion842@gmail.com'));
    topic.addSubscription(
      new snsSubscriptions.EmailSubscription('xscorpion842@gmail.com', {
        json: true,
        filterPolicy: {
          price: sns.SubscriptionFilter.numericFilter({greaterThan: 10})
        }
      })
    );
  
    topic.addSubscription(
      new snsSubscriptions.EmailSubscription('arlen.manasov@icloud.com', {
        json: true,
        filterPolicy: {
          price: sns.SubscriptionFilter.numericFilter({lessThan: 10})
        }
      })
    );
    catalogBatchProcess.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sns:Publish'],
        resources: [topic.topicArn],
      }),
    );

    const dynamoDBPolicy = new iam.PolicyStatement({
      actions: ["dynamodb:Scan", "dynamodb:Query", "dynamodb:GetItem", "dynamodb:PutItem"],
      resources: ["*"],
    })
    getProductById.addToRolePolicy(dynamoDBPolicy)
    getProductsList.addToRolePolicy(dynamoDBPolicy)
    createProduct.addToRolePolicy(dynamoDBPolicy)
    catalogBatchProcess.addToRolePolicy(dynamoDBPolicy)

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
