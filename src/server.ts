import express from "express";
import userRoutes from "./routes/user.routes";
import betRoutes from "./routes/bet.routes";
import cancelRoutes from "./routes/cancel.routes";
import adminRoutes from "./routes/admin.routes";
import settleRoutes from "./routes/settle.routes";

const app = express();
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/bets", betRoutes); // 下单
app.use("/api/bets", settleRoutes); // 结算
app.use("/api/bets", cancelRoutes); // 取消
app.use("/api/admin", adminRoutes);

app.get("/health", (_, res) => {
  res.json({ ok: true });
});
export default app;

if (process.env.NODE_ENV !== "test") {
  app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
  });
}
