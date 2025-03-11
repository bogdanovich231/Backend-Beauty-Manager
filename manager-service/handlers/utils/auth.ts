import { APIGatewayProxyEvent } from "aws-lambda";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_TOKEN || "YOUR-TOKEN";

export const authUser = (
  event: APIGatewayProxyEvent
): {
  userId: string;
  email: string;
} | null => {
  const token = event.headers?.Authorization?.split(" ")[1];

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };
    return decoded;
  } catch (error) {
    return null;
  }
};
