import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarView() {
  const [viewMode, setViewMode] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
      );
    } else {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
      );
    } else {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
    }
  };

  const formatMonth = (date) =>
    date.toLocaleString("ru-RU", { month: "short", year: "numeric" });

  const today = new Date();

  // === Генерация дней ===
  const days = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const offset = (firstDay + 6) % 7;

    const prevMonthDays = new Date(year, month, 0).getDate();
    const prevDays = Array.from({ length: offset }, (_, i) => ({
      date: new Date(year, month - 1, prevMonthDays - offset + i + 1),
      currentMonth: false,
    }));

    const currentDays = Array.from({ length: daysInMonth }, (_, i) => ({
      date: new Date(year, month, i + 1),
      currentMonth: true,
    }));

    const totalCells = 42;
    const nextDaysCount = totalCells - (prevDays.length + currentDays.length);
    const nextDays = Array.from({ length: nextDaysCount }, (_, i) => ({
      date: new Date(year, month + 1, i + 1),
      currentMonth: false,
    }));

    const allDays = [...prevDays, ...currentDays, ...nextDays];

    if (viewMode === "week") {
      const today = currentDate;
      const dayOfWeek = (today.getDay() + 6) % 7;
      const monday = new Date(today);
      monday.setDate(today.getDate() - dayOfWeek);
      return Array.from({ length: 7 }, (_, i) => ({
        date: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i),
        currentMonth: true,
      }));
    }

    return allDays;
  }, [currentDate, viewMode]);

  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <div className="calendar-container">
      {/* === ФИЛЬТРЫ === */}
      <div className="calendar-filters">
        <div className="filters-left">
          <select>
            <option>Статус</option>
            <option>В процессе</option>
            <option>Готово</option>
            <option>Ожидает</option>
          </select>
          <select>
            <option>Исполнитель</option>
            <option>Иванов</option>
            <option>Петров</option>
            <option>Сидоров</option>
          </select>
          <select>
            <option>Тег</option>
            <option>Frontend</option>
            <option>Backend</option>
            <option>Design</option>
          </select>
        </div>

        <div className="filters-right">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="month">Месяц</option>
            <option value="week">Неделя</option>
          </select>

          <div className="month-switcher">
            <button onClick={handlePrev}>
              <ChevronLeft size={18} />
            </button>
            <span>{formatMonth(currentDate)}</span>
            <button onClick={handleNext}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* === ХЕДЕР ДНЕЙ НЕДЕЛИ === */}
      <div
        className={`calendar-week-header ${
          viewMode === "week" ? "week-view" : ""
        }`}
      >
        {dayNames.map((d) => (
          <div key={d} className="calendar-day-header">
            {d}
          </div>
        ))}
      </div>

      {/* === СЕТКА === */}
      <div
        className={`calendar-grid ${viewMode === "week" ? "week-view" : ""}`}
      >
        {days.map((d, index) => {
          const isToday =
            d.date.getDate() === today.getDate() &&
            d.date.getMonth() === today.getMonth() &&
            d.date.getFullYear() === today.getFullYear();

          return (
            <div
              key={index}
              className={`calendar-cell ${d.currentMonth ? "" : "inactive"} ${
                isToday ? "today" : ""
              }`}
            >
              <div className="day-number">{d.date.getDate()}</div>
              <div className="day-content">Задачи...</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
