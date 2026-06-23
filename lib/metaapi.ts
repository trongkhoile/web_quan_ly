import type { TradeSignal } from "./signal-parser";

async function getApi(token: string) {
  // Import động để tránh lỗi 'window is not defined' khi build server-side
  const { default: MetaApi } = await import("metaapi.cloud-sdk");
  return new MetaApi(token);
}

export async function provisionAccount(
  mt5Login: string,
  mt5Password: string,
  mt5Server: string,
  name: string
): Promise<string> {
  const api = await getApi(process.env.METAAPI_TOKEN!);
  const account = await api.metatraderAccountApi.createAccount({
    name,
    type: "cloud-g2",
    login: mt5Login,
    password: mt5Password,
    server: mt5Server,
    platform: "mt5",
    magic: 123456,
  });
  await account.deploy();
  await account.waitConnected();
  return account.id;
}

export async function removeAccount(metaApiId: string) {
  const api = await getApi(process.env.METAAPI_TOKEN!);
  const account = await api.metatraderAccountApi.getAccount(metaApiId);
  await account.undeploy();
  await account.remove();
}

export async function executeTrade(
  metaApiId: string,
  signal: TradeSignal
): Promise<string> {
  const api = await getApi(process.env.METAAPI_TOKEN!);
  const account = await api.metatraderAccountApi.getAccount(metaApiId);
  const connection = account.getRPCConnection();
  await connection.connect();
  await connection.waitSynchronized();

  try {
    if (signal.action === "CLOSE") {
      const result = await connection.closePositionsBySymbol(signal.symbol, {});
      return `Closed positions for ${signal.symbol}: orderId=${result.orderId}`;
    }

    const result =
      signal.action === "BUY"
        ? await connection.createMarketBuyOrder(
            signal.symbol,
            signal.lot,
            signal.sl,
            signal.tp,
            { comment: "TelegramSignal" }
          )
        : await connection.createMarketSellOrder(
            signal.symbol,
            signal.lot,
            signal.sl,
            signal.tp,
            { comment: "TelegramSignal" }
          );

    return `Order placed: orderId=${result.orderId}`;
  } finally {
    await connection.close();
  }
}
