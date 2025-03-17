/*
  Warnings:

  - You are about to drop the `Trade` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Trade" DROP CONSTRAINT "Trade_strategyId_fkey";

-- DropTable
DROP TABLE "Trade";

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "strategyId" TEXT,
    "symbol" TEXT NOT NULL,
    "binanceOrderId" TEXT NOT NULL,
    "clientOrderId" TEXT,
    "side" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "quantity" DOUBLE PRECISION NOT NULL,
    "executedQty" DOUBLE PRECISION,
    "quoteQty" DOUBLE PRECISION,
    "timeInForce" TEXT,
    "stopPrice" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Execution" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "binanceTradeId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "commission" DOUBLE PRECISION,
    "commissionAsset" TEXT,
    "isMaker" BOOLEAN,
    "timestamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Execution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_symbol_idx" ON "Order"("symbol");

-- CreateIndex
CREATE INDEX "Order_binanceOrderId_idx" ON "Order"("binanceOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_userId_binanceOrderId_key" ON "Order"("userId", "binanceOrderId");

-- CreateIndex
CREATE INDEX "Execution_userId_idx" ON "Execution"("userId");

-- CreateIndex
CREATE INDEX "Execution_symbol_idx" ON "Execution"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Execution_userId_binanceTradeId_key" ON "Execution"("userId", "binanceTradeId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Execution" ADD CONSTRAINT "Execution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Execution" ADD CONSTRAINT "Execution_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
