import Elysia, { t } from "elysia";
import { isAuthenticated } from "../middlewares/auth";
import { db } from "../utils/db";
import { messages, users } from "../schema";
import { eq } from "drizzle-orm";

export const webSocketController = new Elysia({
  name: "webSockets",
  prefix: "/chat",
})
  .use(isAuthenticated)
  .ws("/", {
    body: t.Object({
      content: t.String(),
    }),
    open: (ws) => {
      console.log("[INFO] Socket Open");
      ws.subscribe("general");
    },
    message: async (ws, message) => {
      if (!ws.data.data?.username) {
        ws.close();
        return;
      }
      console.log("[INFO] Socket Message", message);
      ws.publish("general", {
        ...message,
        username: ws.data.data.username,
      });

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, ws.data.data.username));

      await db.insert(messages).values({ ...message, userId: user.id });
    },
    close: (ws) => {
      console.log("[INFO] Socket Close");
      ws.unsubscribe("general");
    },
  });
