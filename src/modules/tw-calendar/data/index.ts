export interface CalendarEntry {
  date: string;
  name: string;
  isHoliday: boolean;
  description: string;
}

export const calendarData: Record<number, CalendarEntry[]> = {
  2025: [
    // 元旦
    { date: "2025-01-01", name: "中華民國開國紀念日", isHoliday: true, description: "國定假日" },

    // 農曆春節
    { date: "2025-01-25", name: "週六", isHoliday: true, description: "例假日" },
    { date: "2025-01-26", name: "週日", isHoliday: true, description: "例假日" },
    { date: "2025-01-27", name: "調整放假", isHoliday: true, description: "農曆除夕前調整放假" },
    { date: "2025-01-28", name: "農曆除夕", isHoliday: true, description: "國定假日" },
    { date: "2025-01-29", name: "春節（初一）", isHoliday: true, description: "國定假日" },
    { date: "2025-01-30", name: "春節（初二）", isHoliday: true, description: "國定假日" },
    { date: "2025-01-31", name: "春節（初三）", isHoliday: true, description: "國定假日" },
    { date: "2025-02-01", name: "週六", isHoliday: true, description: "例假日（彈性放假）" },
    { date: "2025-02-08", name: "補班日", isHoliday: false, description: "補 01-27 彈性放假" },

    // 228 和平紀念日
    { date: "2025-02-28", name: "和平紀念日", isHoliday: true, description: "國定假日" },
    { date: "2025-03-01", name: "週六", isHoliday: true, description: "例假日" },

    // 兒童節 + 清明節
    { date: "2025-04-03", name: "調整放假", isHoliday: true, description: "兒童節前調整放假" },
    { date: "2025-04-04", name: "兒童節及民族掃墓節", isHoliday: true, description: "國定假日" },
    { date: "2025-04-05", name: "清明節", isHoliday: true, description: "國定假日" },
    { date: "2025-04-06", name: "週日", isHoliday: true, description: "例假日" },

    // 端午節
    { date: "2025-05-31", name: "端午節", isHoliday: true, description: "國定假日" },
    { date: "2025-06-01", name: "週日", isHoliday: true, description: "例假日" },
    { date: "2025-06-02", name: "調整放假", isHoliday: true, description: "端午節後調整放假" },

    // 中秋節
    { date: "2025-09-27", name: "週六", isHoliday: true, description: "例假日" },
    { date: "2025-09-28", name: "中秋節", isHoliday: true, description: "國定假日" },
    { date: "2025-09-29", name: "調整放假", isHoliday: true, description: "中秋節後調整放假" },

    // 國慶日
    { date: "2025-10-10", name: "國慶日", isHoliday: true, description: "國定假日" },
    { date: "2025-10-11", name: "週六", isHoliday: true, description: "例假日" },
    { date: "2025-10-12", name: "週日", isHoliday: true, description: "例假日" },
  ],

  2026: [
    // 元旦
    { date: "2026-01-01", name: "中華民國開國紀念日", isHoliday: true, description: "國定假日" },
    { date: "2026-01-02", name: "調整放假", isHoliday: true, description: "開國紀念日後調整放假" },
    { date: "2026-01-03", name: "週六", isHoliday: true, description: "例假日" },
    { date: "2026-01-04", name: "週日", isHoliday: true, description: "例假日" },

    // 農曆春節
    { date: "2026-01-17", name: "補班日", isHoliday: false, description: "補 01-30 彈性放假" },
    { date: "2026-01-28", name: "農曆除夕前一日", isHoliday: true, description: "調整放假" },
    { date: "2026-01-29", name: "農曆除夕", isHoliday: true, description: "國定假日" },
    { date: "2026-01-30", name: "春節（初一）", isHoliday: true, description: "國定假日" },
    { date: "2026-01-31", name: "春節（初二）", isHoliday: true, description: "國定假日" },
    { date: "2026-02-01", name: "春節（初三）", isHoliday: true, description: "國定假日" },
    { date: "2026-02-02", name: "調整放假", isHoliday: true, description: "春節後調整放假" },

    // 228 和平紀念日
    { date: "2026-02-27", name: "調整放假", isHoliday: true, description: "和平紀念日前調整放假" },
    { date: "2026-02-28", name: "和平紀念日", isHoliday: true, description: "國定假日" },
    { date: "2026-03-01", name: "週日", isHoliday: true, description: "例假日" },

    // 兒童節 + 清明節
    { date: "2026-04-03", name: "調整放假", isHoliday: true, description: "兒童節前調整放假" },
    { date: "2026-04-04", name: "兒童節及民族掃墓節", isHoliday: true, description: "國定假日" },
    { date: "2026-04-05", name: "清明節", isHoliday: true, description: "國定假日" },
    { date: "2026-04-06", name: "週日", isHoliday: true, description: "例假日" },

    // 端午節
    { date: "2026-05-30", name: "週六", isHoliday: true, description: "例假日" },
    { date: "2026-05-31", name: "端午節", isHoliday: true, description: "國定假日" },
    { date: "2026-06-01", name: "週日", isHoliday: true, description: "例假日" },

    // 中秋節
    { date: "2026-09-19", name: "週六", isHoliday: true, description: "例假日" },
    { date: "2026-09-20", name: "週日", isHoliday: true, description: "例假日" },
    { date: "2026-09-21", name: "中秋節", isHoliday: true, description: "國定假日" },

    // 國慶日
    { date: "2026-10-10", name: "國慶日", isHoliday: true, description: "國定假日" },
    { date: "2026-10-11", name: "週日", isHoliday: true, description: "例假日" },
    { date: "2026-10-12", name: "調整放假", isHoliday: true, description: "國慶日後調整放假" },
  ],
};
