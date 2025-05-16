import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";
import { randomUUID } from "crypto";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-1" });

export const createSlot = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }
    const { serviceId, date, startTime, duration, isAvailable } = JSON.parse(
      event.body
    );

    if (
      !date ||
      !startTime ||
      !serviceId ||
      !duration ||
      isAvailable === undefined
    ) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Invalid slot time data" }),
      };
    }

    const slotId = randomUUID();

    const putCommand = new PutItemCommand({
      TableName: process.env.SLOTS_TABLE!,
      Item: marshall({
        slotId,
        serviceId,
        date,
        start_time: startTime,
        duration,
        is_available: isAvailable,
      }),
    });

    await client.send(putCommand);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: "Slot successfully added",
        slot: {
          slotId,
          serviceId,
          date,
          start_time: startTime,
          duration,
          is_available: isAvailable,
        },
      }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Internal Server Error",
        error: e instanceof Error ? e.message : e,
      }),
    };
  }
};
