import { z } from "zod";
import { calendarData, type CalendarEntry } from "../data/index.js";

export const holidaysToolConfig = {
  description: "查詢台灣指定年份的國定假日、補班日與連假區間",
  inputSchema: {
    year: z.number().describe("西元年份，如 2026"),
  },
};

function loadCalendarData(year: number): CalendarEntry[] | null {
  return calendarData[year] ?? null;
}

function findConsecutiveHolidays(entries: CalendarEntry[]): string[] {
  const holidayDates = entries
    .filter((e) => e.isHoliday)
    .map((e) => ({ date: new Date(e.date), name: e.name, raw: e.date }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const blocks: { start: string; end: string; days: number; names: string[] }[] = [];
  let current: { start: string; end: string; days: number; names: string[] } | null = null;

  for (const entry of holidayDates) {
    if (!current) {
      current = { start: entry.raw, end: entry.raw, days: 1, names: [entry.name] };
      continue;
    }

    const prevDate = new Date(current.end);
    const diff = (entry.date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diff <= 1) {
      current.end = entry.raw;
      current.days++;
      current.names.push(entry.name);
    } else {
      if (current.days >= 3) blocks.push(current);
      current = { start: entry.raw, end: entry.raw, days: 1, names: [entry.name] };
    }
  }
  if (current && current.days >= 3) blocks.push(current);

  return blocks.map((b) => {
    const keyNames = b.names.filter(
      (n) => !n.startsWith("週") && n !== "調整放假",
    );
    const label = keyNames.length > 0 ? keyNames.join("、") : b.names[0];
    return `${b.start} ~ ${b.end}（${b.days} 天，${label}）`;
  });
}

export async function holidaysHandler(args: { year: number }) {
  const entries = loadCalendarData(args.year);

  if (!entries) {
    return {
      content: [
        {
          type: "text" as const,
          text: `目前沒有 ${args.year} 年的假日資料。目前支援年份：${Object.keys(calendarData).join("、")}`,
        },
      ],
    };
  }

  const nationalHolidays = entries.filter(
    (e) => e.isHoliday && e.description.includes("國定假日"),
  );
  const makeupDays = entries.filter((e) => !e.isHoliday);
  const consecutiveBlocks = findConsecutiveHolidays(entries);

  const sections: string[] = [];

  // Section 1: National holidays
  sections.push("【國定假日】");
  for (const h of nationalHolidays) {
    sections.push(`  ${h.date}  ${h.name}`);
  }

  // Section 2: Makeup workdays
  sections.push("");
  sections.push("【補班日】");
  if (makeupDays.length === 0) {
    sections.push("  （無）");
  } else {
    for (const m of makeupDays) {
      sections.push(`  ${m.date}  ${m.name}（${m.description}）`);
    }
  }

  // Section 3: Consecutive holidays
  sections.push("");
  sections.push("【連假區間】（3 天以上）");
  if (consecutiveBlocks.length === 0) {
    sections.push("  （無）");
  } else {
    for (const block of consecutiveBlocks) {
      sections.push(`  ${block}`);
    }
  }

  return {
    content: [
      {
        type: "text" as const,
        text: `${args.year} 年台灣假日一覽\n${"─".repeat(30)}\n${sections.join("\n")}`,
      },
    ],
  };
}
