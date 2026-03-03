# Forecast-Platform 技术测验项目

本项目是一个简化版的预测（下注）平台的后端实现，类似Polymarket平台的核心逻辑，重点关注账户余额管理、幂等性处理、状态机控制及账本对账机制。

---

## 一、技术栈

- Node.js
- TypeScript
- Express
- Prisma
- SQLite
- Vitest

---

## 二、系统功能概述

### 1. 用户系统
- 用户数据通过数据库 seed 预置
- 不支持运行时动态创建用户
- 用户余额字段仅作为缓存存在

### 2. 充值功能（Deposit）
- 接口：`POST /api/users/:id/deposit`
- 使用 `Idempotency-Key` 保证幂等性
- 重复请求不会重复入账
- 金额变更通过账本追加记录完成

### 3. 下注功能（Bet）
- 接口：`POST /api/bets`
- 下单前校验余额，禁止出现负余额
- 创建下注记录时状态为 `PLACED`
- 同样支持幂等请求

### 4. 下注状态机
下注状态枚举：
- `PLACED`
- `SETTLED`
- `CANCELLED`

合法流转规则：
- `PLACED → SETTLED`
- `PLACED → CANCELLED`
- 终态不可再次变更

### 5. 结算与取消
- 结算接口：`POST /api/bets/:id/settle`
  - WIN：返还本金并发放奖励
  - LOSE：不返还余额
- 取消接口：`POST /api/bets/:id/cancel`
  - 仅允许在 PLACED 状态下执行
  - 自动退款并更新账本

---

## 三、账本模型设计（Ledger）

系统采用 **追加式账本（Append-only Ledger）** 设计：

账本类型包括：
- `DEPOSIT`：充值
- `BET_DEBIT`：下注扣款
- `BET_CREDIT`：结算派奖
- `BET_REFUND`：取消退款

核心原则：
- 禁止直接修改历史账务记录
- 用户余额必须与账本加总结果保持一致
- 所有资金变更均在数据库事务中完成

---

## 四、对账接口（Admin Reconciliation）

接口：`GET /api/admin/reconcile?userId=1`

返回内容：
- 当前数据库记录余额
- 账本推导余额
- 各下注状态统计
- 异常检测（如余额不一致）

---

## 五、自动化测试

使用 Vitest，覆盖以下核心场景：

1. 充值成功后余额变化
2. 充值幂等性验证
3. 余额不足时下注失败
4. 下注幂等性验证
5. 已结算订单不可重复结算

执行测试：`pnpm test`

---

## 六、项目启动方式

```bash
pnpm install
pnpm exec prisma migrate dev
pnpm exec prisma db seed
pnpm run dev
```

服务默认启动在：`http://localhost:3000`


---

## 七、项目自动化测试及手动测试

prisma数据库可视化（可供观察数据变化）：`pnpm exec prisma studio`

执行**自动化**测试：`pnpm test`

**自动化**测试结果如下：

```
 ✓ src/tests/core.test.ts (5 tests) 315ms
   ✓ Core flows (5)
     ✓ deposit increases balance 147ms
     ✓ deposit idempotency works 26ms
     ✓ bet fails on insufficient balance 43ms
     ✓ bet idempotency works 38ms
     ✓ settled bet cannot be settled again 57ms

 Test Files  1 passed (1)
      Tests  5 passed (5)
```

**手动**测试：

1. 检查服务是否正常：

   ```
   curl http://localhost:3000/health
   ```
   
2. 充值接口（+100）：

   ```
   curl -X POST http://localhost:3000/api/users/1/deposit ^ -H "Content-Type: application/json" ^ -H "Idempotency-Key: dep-001" ^ -d "{\"amount\":100}"
   ```

3. 幂等测试（重复相同 Idempotency-Key）

   ```
   curl -X POST http://localhost:3000/api/users/1/deposit ^ -H "Content-Type: application/json" ^ -H "Idempotency-Key: dep-001" ^ -d "{\"amount\":100}"
   ```

4. 余额不足下注

   ```
   curl -X POST http://localhost:3000/api/bets ^ -H "Content-Type: application/json" ^ -H "Idempotency-Key: bet-fail-001" ^ -d "{\"userId\":2,\"amount\":9999,\"gameId\":\"GAME-001\"}"
   ```

5. 结算下注

   ```
   curl -X POST http://localhost:3000/api/bets/1/settle ^ -H "Content-Type: application/json" ^ -H "Idempotency-Key: settle-001" ^ -d "{\"result\":\"WIN\"}"
   ```

6. 重复结算

   ```
   curl -X POST http://localhost:3000/api/bets/1/settle ^ -H "Content-Type: application/json" ^ -H "Idempotency-Key: settle-002" ^ -d "{\"result\":\"WIN\"}"
   ```

7. 取消下注

   ```
   // 新建一个下注用于取消
   curl -X POST http://localhost:3000/api/bets ^ -H "Content-Type: application/json" ^ -H "Idempotency-Key: bet-cancel-001" ^ -d "{\"userId\":1,\"amount\":100,\"gameId\":\"GAME-001\"}"
   
   // 假设返回的betId是2
   curl -X POST http://localhost:3000/api/bets/2/cancel ^ -H "Idempotency-Key: cancel-001"
   ```

8. 对账接口

   ```
   curl http://localhost:3000/api/admin/reconcile?userId=1
   ```

9. 非法状态取消

   ```
   curl -X POST http://localhost:3000/api/bets/1/cancel ^ -H "Idempotency-Key: cancel-invalid"
   ```

   

