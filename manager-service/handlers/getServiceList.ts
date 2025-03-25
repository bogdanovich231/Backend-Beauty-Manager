import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-1" });

export const getServiceList = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const serviceCommand = new ScanCommand({
      TableName: process.env.SERVICE_TABLE!,
    });

    const result = await client.send(serviceCommand);

    const serviceList = result.Items?.map((item) => unmarshall(item));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        serviceList,
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
