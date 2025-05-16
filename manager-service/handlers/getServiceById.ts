import {
  DynamoDBClient,
  GetItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-1" });

export const getServiceById = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const serviceId = event.pathParameters?.serviceId;

    if (!serviceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Service ID is required" }),
      };
    }

    const getServiceCommand = new GetItemCommand({
      TableName: process.env.SERVICES_TABLE!,
      Key: marshall({
        serviceId: serviceId,
      }),
    });

    const serviceResult = await client.send(getServiceCommand);

    if (!serviceResult.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: "Service not found" }),
      };
    }

    const slotsCommand = new QueryCommand({
      TableName: process.env.SLOTS_TABLE!,
      IndexName: "ServiceIdIndex",
      KeyConditionExpression: "serviceId = :serviceId",
      ExpressionAttributeValues: {
        ":serviceId": { S: serviceId },
      },
    });

    const slotsResult = await client.send(slotsCommand);

    const service = unmarshall(serviceResult.Item);
    const slots = slotsResult.Items?.map((item) => unmarshall(item)) || [];

    const response = {
      ...service,
      slots,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
