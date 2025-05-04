import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";
import { marshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({ region: "eu-west-1" });

export const addFavorite = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : null;

    if (!body || !body.userId || !body.salonId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "userId and salonId are required" }),
      };
    }

    const favoriteId = randomUUID();

    const putItemCommand = new PutItemCommand({
      TableName: process.env.FAVORITES_TABLE!,
      Item: marshall({
        favoriteId,
        userId: body.userId,
        salonId: body.salonId,
      }),
    });

    await client.send(putItemCommand);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: "Favorite added successfully",
        favoriteId,
      }),
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
