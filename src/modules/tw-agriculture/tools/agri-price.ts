import { z } from "zod";
import { cached } from "../../../cache/index.js";
import { fetchAgriPrice, resolveCropName } from "../clients/afa.js";

export const agriPriceToolConfig = {
  description:
    "查詢台灣農產品批發市場行情，包含各市場均價、價格範圍與交易量",
  inputSchema: {
    product: z
      .string()
      .describe(
        '農產品名稱，如「甘藍」「高麗菜」「蕹菜」「空心菜」「香蕉」「西瓜」',
      ),
  },
};

export async function agriPriceHandler({
  product,
}: {
  product: string;
}) {
  try {
    const resolvedName = resolveCropName(product);
    const prices = await cached(
      `agri-price:${resolvedName}`,
      3600,
      () => fetchAgriPrice(product),
    );

    if (prices.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `找不到「${product}」的農產品行情資料，請確認作物名稱或嘗試其他名稱`,
          },
        ],
      };
    }

    const result = prices
      .map(
        (p) =>
          `${p.市場名稱}：均價 ${p.平均價} 元/kg（${p.下價}~${p.上價}），交易量 ${p.交易量} kg`,
      )
      .join("\n");

    return {
      content: [{ type: "text" as const, text: result }],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `查詢農產品行情失敗: ${error instanceof Error ? error.message : "未知錯誤"}`,
        },
      ],
      isError: true,
    };
  }
}
