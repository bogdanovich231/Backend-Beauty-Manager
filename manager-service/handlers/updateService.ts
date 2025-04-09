import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";


const client = new DynamoDBClient({ region: "eu-west-1" });

export const updateService = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const serviceId = event.pathParameters?.serviceId;

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }
    if (!serviceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Missing parameter" }),
      };
    }
    const { price, title} = JSON.parse(
      event.body
    );

    const updateCommand = new UpdateItemCommand({
      TableName: process.env.SERVICES_TABLE!,
      Key: {
        serviceId: {S: serviceId},
      },
      UpdateExpression:
        "SET title = :title, price = :price",
        ExpressionAttributeValues:{
            ":price": { N: price.toString() },
            ":title": {S: title},
        },
      ConditionExpression: "attribute_exists(serviceId)",
      ReturnValues: "ALL_NEW", 
    });

    const updateResult = await client.send(updateCommand);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Service updated successfully",
        updatedService: updateResult.Attributes,
      }),
    };
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: "Service not found" }),
      };
    }

    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};

export default updateService;
