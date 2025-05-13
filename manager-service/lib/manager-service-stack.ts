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

    const salonsTable = dynamodb.Table.fromTableName(
      this,
      "SalonsTable",
      "Salons"
    );

    const servicesTable = dynamodb.Table.fromTableName(
      this,
      "ServicesTable",
      "Services"
    );

    const favoritesTable = dynamodb.Table.fromTableName(
      this,
      "FavoritesTable",
      "favorites"
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
        actions: [
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
        ],
        resources: [
          usersTable.tableArn,
          salonsTable.tableArn,
          servicesTable.tableArn,
          favoritesTable.tableArn,
          `arn:aws:dynamodb:eu-west-1:${cdk.Aws.ACCOUNT_ID}:table/Salons`,
          `arn:aws:dynamodb:eu-west-1:${cdk.Aws.ACCOUNT_ID}:table/Services`,
          `arn:aws:dynamodb:eu-west-1:${cdk.Aws.ACCOUNT_ID}:table/Users`,
          `arn:aws:dynamodb:eu-west-1:${cdk.Aws.ACCOUNT_ID}:table/Users/index/EmailIndex`,
          `arn:aws:dynamodb:eu-west-1:${cdk.Aws.ACCOUNT_ID}:table/favorites`,
          `arn:aws:dynamodb:eu-west-1:${cdk.Aws.ACCOUNT_ID}:table/favorites/index/UserIdIndex`,
        ],
      })
    );

    usersTable.grantReadWriteData(lambdaRole);
    salonsTable.grantReadWriteData(lambdaRole);
    servicesTable.grantReadWriteData(lambdaRole);
    favoritesTable.grantReadWriteData(lambdaRole);

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

    const createSalonLambda = new lambda.Function(this, "CreateSalonLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "createSalon.createSalon",
      code: lambda.Code.fromAsset("dist/handlers"),
      environment: {
        SALON_TABLE: salonsTable.tableName,
      },
      role: lambdaRole,
    });

    const updateSalonLambda = new lambda.Function(this, "UpdateSalonLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "updateSalon.updateSalon",
      code: lambda.Code.fromAsset("dist/handlers"),
      environment: {
        SALON_TABLE: salonsTable.tableName,
      },
      role: lambdaRole,
    });

    const getServiceLambda = new lambda.Function(this, "GetServiceLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "getServiceById.getServiceById",
      code: lambda.Code.fromAsset("dist/handlers"),
      environment: {
        SERVICES_TABLE: servicesTable.tableName,
      },
      role: lambdaRole,
    });

    const updateServiceLambda = new lambda.Function(
      this,
      "UpdateServiceLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "updateService.updateService",
        code: lambda.Code.fromAsset("dist/handlers"),
        environment: {
          SERVICES_TABLE: servicesTable.tableName,
        },
        role: lambdaRole,
      }
    );

    const deleteServiceLambda = new lambda.Function(
      this,
      "DeleteServiceLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "deleteService.deleteService",
        code: lambda.Code.fromAsset("dist/handlers"),
        environment: {
          SERVICES_TABLE: servicesTable.tableName,
        },
        role: lambdaRole,
      }
    );

    const getSalonsListLambda = new lambda.Function(
      this,
      "GetSalonsListLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "getSalonsList.getSalonsList",
        code: lambda.Code.fromAsset("dist/handlers"),
        environment: {
          SALON_TABLE: salonsTable.tableName,
        },
        role: lambdaRole,
      }
    );

    const getSalonByIdLambda = new lambda.Function(this, "GetSalonByIdLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "getSalonById.getSalonById",
      code: lambda.Code.fromAsset("dist/handlers"),
      environment: {
        SALON_TABLE: salonsTable.tableName,
      },
      role: lambdaRole,
    });

    const createServiceLambda = new lambda.Function(
      this,
      "CreateServiceLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "createServices.createServices",
        code: lambda.Code.fromAsset("dist/handlers"),
        environment: {
          SERVICES_TABLE: servicesTable.tableName,
        },
        role: lambdaRole,
      }
    );

    const getServicesListLambda = new lambda.Function(
      this,
      "GetServicesListLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "getServicesList.getServicesList",
        code: lambda.Code.fromAsset("dist/handlers"),
        environment: {
          SERVICES_TABLE: servicesTable.tableName,
        },
        role: lambdaRole,
      }
    );

    const addFavoriteLambda = new lambda.Function(this, "AddFavoriteLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "addFavorite.addFavorite",
      code: lambda.Code.fromAsset("dist/handlers"),
      environment: {
        FAVORITES_TABLE: favoritesTable.tableName,
      },
      role: lambdaRole,
    });

    const getFavoritesLambda = new lambda.Function(this, "GetFavoritesLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "getFavorites.getFavorites",
      code: lambda.Code.fromAsset("dist/handlers"),
      environment: {
        FAVORITES_TABLE: favoritesTable.tableName,
      },
      role: lambdaRole,
    });

    const deleteFavoriteLambda = new lambda.Function(
      this,
      "DeleteFavoriteLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "deleteFavorite.deleteFavorite",
        code: lambda.Code.fromAsset("dist/handlers"),
        environment: {
          FAVORITES_TABLE: favoritesTable.tableName,
        },
        role: lambdaRole,
      }
    );

    const api = new apigateway.RestApi(this, "ManagerServiceApi", {
      restApiName: "Manager Service",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });

    const usersResource = api.root.addResource("users");
    const loginResource = usersResource.addResource("login");
    const userResource = usersResource.addResource("{id}");
    const salonsResource = api.root.addResource("salons");
    const salonResource = salonsResource.addResource("{id}");
    const serviceResource = salonResource.addResource("services");
    const serviceIdResource = serviceResource.addResource("{serviceId}");
    const favoritesResource = api.root.addResource("favorites");

    favoritesResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(addFavoriteLambda)
    );

    favoritesResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getFavoritesLambda)
    );

    favoritesResource
      .addResource("{id_service}")
      .addMethod(
        "DELETE",
        new apigateway.LambdaIntegration(deleteFavoriteLambda)
      );

    salonsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createSalonLambda)
    );

    salonResource.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(updateSalonLambda)
    );

    serviceResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createServiceLambda)
    );
    serviceResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getServicesListLambda)
    );
    serviceIdResource.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(deleteServiceLambda)
    );

    serviceIdResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getServiceLambda)
    );

    serviceIdResource.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(updateServiceLambda)
    );

    salonsResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getSalonsListLambda)
    );

    salonResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getSalonByIdLambda)
    );

    usersResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createUserLambda)
    );

    loginResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(loginUserLambda)
    );

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
