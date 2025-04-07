import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-1" });

export const getSalonsList = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const salonCommand = new ScanCommand({
      TableName: process.env.SALON_TABLE!,
    });

    const result = await client.send(salonCommand);

    const salonsList = result.Items?.map((item) => unmarshall(item));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        salonsList,
      }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Internal Server Error",
        error: e,
      }),
    };
  }
};
