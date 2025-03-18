import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class ManagerServiceStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const usersTable = dynamodb.Table.fromTableName(
      this,
      "UsersTable",
      "Users"
    );

    const lambdaRole = new iam.Role(this, "LambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["dynamodb:UpdateItem", "dynamodb:Query", "dynamodb:GetItem"],
        resources: [
          usersTable.tableArn,
          `arn:aws:dynamodb:eu-west-1:${cdk.Aws.ACCOUNT_ID}:table/Users`,
          `arn:aws:dynamodb:eu-west-1:${cdk.Aws.ACCOUNT_ID}:table/Users/index/EmailIndex`,
        ],
      })
    );

    usersTable.grantReadWriteData(lambdaRole);

    const createUserLambda = new lambda.Function(this, "CreateUserLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "createUser.createUser",
      code: lambda.Code.fromAsset("dist/handlers"),
      environment: {
        USERS_TABLE: usersTable.tableName,
        JWT_SECRET: process.env.JWT_TOKEN || "YOUR-TOKEN",
      },
      role: lambdaRole,
    });

    const loginUserLambda = new lambda.Function(this, "LoginUserLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "loginUser.loginUser",
      code: lambda.Code.fromAsset("dist/handlers"),
      environment: {
        USERS_TABLE: usersTable.tableName,
        JWT_SECRET: process.env.JWT_TOKEN || "YOUR-TOKEN",
      },
      role: lambdaRole,
    });

    const updateUserLambda = new lambda.Function(this, "UpdateUserLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "updateUser.updateUser",
      code: lambda.Code.fromAsset("dist/handlers"),
      environment: {
        USERS_TABLE: usersTable.tableName,
      },
      role: lambdaRole,
    });

    const getUserLambda = new lambda.Function(this, "GetUserLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "getUser.getUser",
      code: lambda.Code.fromAsset("dist/handlers"),
      environment: {
        USERS_TABLE: usersTable.tableName,
        JWT_SECRET: process.env.JWT_TOKEN || "YOUR-TOKEN",
      },
      role: lambdaRole,
    });

    const api = new apigateway.RestApi(this, "ManagerServiceApi", {
      restApiName: "Manager Service",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });

    const usersResource = api.root.addResource("users");

    usersResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createUserLambda)
    );

    const loginResource = usersResource.addResource("login");

    loginResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(loginUserLambda)
    );

    const userResource = usersResource.addResource("{id}");

    userResource.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(updateUserLambda)
    );
    userResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getUserLambda)
    );
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url!,
    });
  }
}
