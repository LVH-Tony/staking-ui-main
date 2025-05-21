// Web Worker for PnL calculations
onmessage = function (e) {
  const { stakingData, balancesInfo } = e.data;

  // Create a map to store calculations by subnet
  const subnetCalculations = new Map();

  // Single pass through staking data
  stakingData.forEach((tx) => {
    const netUid = tx.net_uid;
    if (!subnetCalculations.has(netUid)) {
      subnetCalculations.set(netUid, {
        totalBought: { tao: 0, value: 0 },
        totalSold: { tao: 0, value: 0 },
        transactions: [],
      });
    }

    const subnetData = subnetCalculations.get(netUid);
    const taoAmount = Number(tx.tao) / 1e9;
    const alphaAmount = Number(tx.alpha) / 1e9;
    const price = taoAmount / alphaAmount;
    const value = taoAmount * price;

    if (tx.action === "STAKING") {
      subnetData.totalBought.tao += taoAmount;
      subnetData.totalBought.value += value;
      subnetData.transactions.push({ tao: taoAmount, alpha: alphaAmount });
    } else if (tx.action === "UNSTAKING") {
      subnetData.totalSold.tao += taoAmount;
      subnetData.totalSold.value += value;
    }
  });

  // Calculate final values
  const results = {};

  subnetCalculations.forEach((data, netUid) => {
    if (netUid === 0) return; // Skip root subnet

    const { totalBought, totalSold } = data;
    const currentBalance = balancesInfo.find((b) => b.netUid === netUid);

    if (!currentBalance) return;

    // Calculate average buy price
    const avgBuyPrice =
      totalBought.tao > 0 ? totalBought.value / totalBought.tao : 0;

    if (avgBuyPrice > 0) {
      // Calculate realized PnL
      const realizedPnL =
        totalSold.tao > 0 ? totalSold.value - totalSold.tao * avgBuyPrice : 0;

      // Calculate unrealized PnL
      const currentValue = currentBalance.alpha * currentBalance.price;
      const costBasis = currentBalance.alpha * avgBuyPrice;
      const unrealizedPnL = currentValue - costBasis;

      // Total PnL
      const totalPnL = realizedPnL + unrealizedPnL;

      if (!isNaN(totalPnL) && isFinite(totalPnL)) {
        results[netUid] = {
          avgBuyPrice,
          pnl: totalPnL,
        };
      }
    }
  });

  postMessage(results);
};
