import { ReactNode, useCallback, useState } from "react";
import cx from "classnames";
import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  getMonth,
  getYear,
  isSameDay,
  isSameMonth,
  isWeekend,
  isWithinInterval,
  setMonth,
  setYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns/fp";

import "./App.scss";
type Range = [Date | null, Date | null];
const noop = () => {};

const App = () => {
  const today = new Date();
  const [sampleRange, setSampleRange] = useState<Range>([
    addDays(-5, today),
    addDays(-3, today),
  ]);
  return (
    <div className="App">
      <DatePicker
        onChange={(x) => setSampleRange(x)}
        onSelect={(x) => console.log(x)}
        range={sampleRange}
        // selected={addDays(5, new Date())}
      />
      <div>
        <input
          type="text"
          readOnly
          value={sampleRange
            .map((x) => (x ? format("dd/MM/yyyy", x) : "empty"))
            .join(" | ")}
        />
        <button onClick={() => setSampleRange([null, null])}>clear</button>
      </div>
    </div>
  );
};

const DatePicker = ({
  onChange = noop,
  onSelect = noop,
  range,
  selected: initialSelected = new Date(),
}: {
  onChange?(x: Range): void;
  onSelect?(x: Date): void;
  range: Range;
  selected?: Date;
}) => {
  const [selected, setSelected] = useState(initialSelected);
  const [monthView, setMonthView] = useState(initialSelected);
  const [[start, end], setRange] = useState<Range>([null, null]);
  const handleSelect = useCallback(
    (x: Date) => {
      if (!end) {
        const min = Math.min();
        const sorted = [start, x]
          .slice()
          .sort(
            (a, b) => (a?.getTime() ?? min) - (b?.getTime() ?? min)
          ) as Range;
        setRange(sorted);
        onChange(sorted);
      } else {
        setRange([x, null]);
      }
      setSelected(x);
      onSelect(x);
    },
    [start, end, onChange, onSelect]
  );

  const nextMonth = addMonths(1, monthView);
  const increment = (x: number) => () =>
    setMonthView((prev) => addMonths(x, prev));

  return (
    <div className="datepicker">
      <div className="months-wrapper">
        <Month
          month={monthView}
          onSelect={handleSelect}
          range={range}
          selected={selected}
          customHeader={
            <>
              <MonthSelector month={monthView} onSelect={setMonthView} />
              <YearSelector year={monthView} onSelect={setMonthView} />
            </>
          }
        />
        <Month
          month={nextMonth}
          onSelect={handleSelect}
          range={range}
          selected={selected}
        />
      </div>
      <div className="controls">
        <button onClick={increment(-1)}>prev</button>
        <button onClick={() => setMonthView(new Date())}>today</button>
        <button onClick={increment(1)}>next</button>
      </div>
    </div>
  );
};

const Month = ({
  month,
  onSelect: onChange,
  range,
  selected,
  customHeader,
}: {
  range: Range;
  month: Date;
  onSelect(x: Date): void;
  selected: Date | null;
  customHeader?: ReactNode;
}) => {
  const sm = startOfMonth(month);
  const sfw = startOfWeek(sm);
  const em = endOfMonth(sm);
  const elw = endOfWeek(em);
  const totalDays = differenceInCalendarDays(sfw, elw) + 1;
  const weeks = Math.floor(totalDays / 7);
  const days = Array(totalDays)
    .fill(null)
    .map((_, idx) => addDays(idx, sfw));

  return (
    <div className="month-wrapper">
      <div className="month-title">
        {customHeader ? customHeader : format("MMM", sm)}
      </div>
      <div className={cx("month", `weeks-${Math.floor(weeks)}`)}>
        {days.map((x) => (
          <Day
            value={x}
            month={month}
            key={x.getTime()}
            onSelect={onChange}
            range={range}
            selected={selected}
          />
        ))}
      </div>
    </div>
  );
};

const MonthSelector = ({
  month,
  onSelect = noop,
}: {
  month: Date;
  onSelect?(s: Date): void;
}) => {
  const sy = startOfYear(month);
  const formatter = format("MMM");
  const months = Array(12)
    .fill(null)
    .map((_, idx) => addMonths(idx, sy));
  return (
    <select
      value={getMonth(month)}
      onChange={({ target: { value } }) =>
        onSelect(setMonth(parseInt(value), month))
      }
    >
      {months.map((x, idx) => (
        <option key={idx} value={getMonth(x)}>
          {formatter(x)}
        </option>
      ))}
    </select>
  );
};

const YearSelector = ({
  year,
  onSelect = noop,
}: {
  year: Date;
  onSelect?(s: Date): void;
}) => {
  const fromYear = addYears(-4, year);
  const years = Array(10)
    .fill(null)
    .map((_, idx) => addYears(idx, fromYear));

  return (
    <select
      value={getYear(year)}
      onChange={({ target: { value } }) =>
        onSelect(setYear(parseInt(value), year))
      }
    >
      {years.map((y, idx) => (
        <option key={idx}>{format("yyyy", y)}</option>
      ))}
    </select>
  );
};

const Day = ({
  value,
  month,
  onSelect: onChange,
  range: [start, end],
  selected,
}: {
  value: Date;
  month: Date;
  onSelect(x: Date): void;
  range: Range;
  selected: Date | null;
}) => {
  const today = isSameDay(value, new Date());
  const grayout = !isSameMonth(value, month);
  const weekend = isWeekend(value);
  const inRange = start && end && isWithinInterval({ start, end }, value);
  const isSelected = selected && isSameDay(selected, value);
  return (
    <div
      role="button"
      tabIndex={0}
      className={cx("day", {
        today,
        grayout,
        weekend,
        selected: isSelected,
        "in-range": inRange,
      })}
      onKeyPress={({ key }) => key === "Enter" && onChange(value)}
      onClick={() => onChange(value)}
    >
      {format("d", value)}
    </div>
  );
};

export default App;
