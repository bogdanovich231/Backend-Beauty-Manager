import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-1" });

export const getServicesList = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const salonId = event.pathParameters?.id;

    if (!salonId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "salonId is required in the path." }),
      };
    }

    const params = {
      TableName: process.env.SERVICES_TABLE!,
      FilterExpression: "salonId = :salonId",
      ExpressionAttributeValues: {
        ":salonId": { S: salonId },
      },
    };

    const command = new ScanCommand(params);
    const result = await client.send(command);

    const services = result.Items?.map((item) => unmarshall(item)) || [];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(services),
    };
  } catch (error) {
    console.error("Error fetching services:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
