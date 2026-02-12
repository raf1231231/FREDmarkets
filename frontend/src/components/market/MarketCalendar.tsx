"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MarketSummary } from "@/types/market";

interface MarketCalendarProps {
  markets: MarketSummary[];
  dateField?: "closesAt" | "resolvesAt";
}

export default function MarketCalendar({ markets, dateField = "closesAt" }: MarketCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { year, month } = useMemo(() => {
    return {
      year: currentDate.getFullYear(),
      month: currentDate.getMonth(),
    };
  }, [currentDate]);

  const { firstDay, daysInMonth, daysInPrevMonth, marketsByDate } = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Group markets by date
    const byDate = new Map<string, MarketSummary[]>();
    markets.forEach((market) => {
      const timestamp = market[dateField];
      const date = new Date(timestamp * 1000);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, []);
      }
      byDate.get(dateKey)!.push(market);
    });

    return { firstDay, daysInMonth, daysInPrevMonth, marketsByDate: byDate };
  }, [markets, year, month, dateField]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Generate calendar cells
  const calendarCells: Array<{ date: number; isCurrentMonth: boolean; dateKey: string }> = [];

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateKey = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    calendarCells.push({ date: day, isCurrentMonth: false, dateKey });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    calendarCells.push({ date: day, isCurrentMonth: true, dateKey });
  }

  // Next month days to fill grid
  const remainingCells = 42 - calendarCells.length;
  for (let day = 1; day <= remainingCells; day++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateKey = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    calendarCells.push({ date: day, isCurrentMonth: false, dateKey });
  }

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="bg-white rounded-[5px] border border-fred-gray-200 overflow-hidden">
      {/* Calendar header */}
      <div className="px-6 py-4 border-b border-fred-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-fred-navy">{monthName}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm text-fred-gray-600 hover:text-fred-navy border border-fred-gray-300 rounded hover:border-fred-gray-400 transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToPrevMonth}
            className="p-2 text-fred-gray-600 hover:text-fred-navy hover:bg-fred-gray-100 rounded transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 text-fred-gray-600 hover:text-fred-navy hover:bg-fred-gray-100 rounded transition-colors"
            aria-label="Next month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-fred-gray-200 bg-fred-gray-50">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="px-2 py-2 text-center text-xs font-semibold text-fred-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-fred-gray-200">
        {calendarCells.map((cell, idx) => {
          const marketsOnDate = marketsByDate.get(cell.dateKey) || [];
          const isToday = cell.dateKey === todayKey && cell.isCurrentMonth;

          return (
            <div
              key={idx}
              className={`min-h-[100px] p-2 ${
                cell.isCurrentMonth ? "bg-white" : "bg-fred-gray-50"
              } ${isToday ? "ring-2 ring-inset ring-fred-blue" : ""}`}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  cell.isCurrentMonth ? "text-fred-gray-800" : "text-fred-gray-400"
                } ${isToday ? "text-fred-blue font-bold" : ""}`}
              >
                {cell.date}
              </div>

              {/* Markets on this date */}
              <div className="space-y-1">
                {marketsOnDate.slice(0, 3).map((market) => (
                  <Link
                    key={market.publicKey}
                    href={`/markets/${market.publicKey}`}
                    className="block p-1.5 text-xs rounded bg-fred-blue/10 hover:bg-fred-blue/20 border-l-2 border-fred-blue transition-colors"
                  >
                    <div className="font-medium text-fred-navy truncate">
                      {market.title}
                    </div>
                    <div className="text-fred-gray-600 text-[10px] mt-0.5">
                      {market.fredSeriesId}
                    </div>
                  </Link>
                ))}
                {marketsOnDate.length > 3 && (
                  <div className="text-[10px] text-fred-gray-600 pl-1.5 pt-0.5">
                    +{marketsOnDate.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
