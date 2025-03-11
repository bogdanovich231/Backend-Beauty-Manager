import {
  DynamoDBClient,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";
import { marshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const client = new DynamoDBClient({ region: "eu-west-1" });
const JWT_SECRET = process.env.JWT_TOKEN || "YOUR-TOKEN";

export const createUser = async (
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

    const { name, email, password, image, is_admin } = JSON.parse(event.body);

    if (!name || !email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Invalid user data" }),
      };
    }
    const saltRounds = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userId = randomUUID();

    const transactionCommand = new TransactWriteItemsCommand({
      TransactItems: [
        {
          Put: {
            TableName: process.env.USERS_TABLE!,
            Item: marshall({
              id: userId,
              name,
              email,
              password: hashedPassword,
              image: image || "",
              is_admin: is_admin || false,
            }),
          },
        },
      ],
    });

    await client.send(transactionCommand);
    const jwtToken = jwt.sign(
      {
        userId: userId,
        email: email,
      },
      JWT_SECRET,
      {
        expiresIn: "12h",
      }
    );
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: "Register successful",
        jwtToken,
        user: {
          id: userId,
          email: email,
          name: name,
          is_admin: is_admin,
        },
      }),
    };
  } catch (e) {
    console.error("Error:", e);
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
