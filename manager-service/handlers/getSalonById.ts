import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-1" });

export const getSalonById = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const salonId = event.pathParameters?.id;

    if (!salonId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Salon ID is required" }),
      };
    }

    const salonCommand = new GetItemCommand({
      TableName: process.env.SALON_TABLE!,
      Key: {
        salonId: { S: salonId },
      },
    });
    const salonResult = await client.send(salonCommand);

    if (!salonResult.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: "Salon not found" }),
      };
    }

    const salon = unmarshall(salonResult.Item);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(salon),
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

export default getSalonById;
