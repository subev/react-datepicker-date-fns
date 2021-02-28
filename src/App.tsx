import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import cx from "classnames";
import { times, identity, splitEvery } from "ramda";
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
  startOfYear,
} from "date-fns/fp";
import startOfWeek from "date-fns/startOfWeek";

import "./App.scss";
type Range = [Date | null, Date | null];
const noop = () => {};
const WEEK_STARTS_ON = 1;

const keyMap: Partial<Record<string, number>> = {
  ArrowUp: -7,
  ArrowDown: 7,
  ArrowLeft: -1,
  ArrowRight: 1,
};

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
      />
      <div className="inputs-wrapper">
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
  const [focused, setFocused] = useState<null | Date>(null);
  const [monthView, setMonthView] = useState(initialSelected);
  const [[start, end], setRange] = useState<Range>([null, null]);

  const nextMonth = addMonths(1, monthView);

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

  const increment = (x: number) => () =>
    setMonthView((prev) => addMonths(x, prev));
  const handleKeyPress: React.KeyboardEventHandler<HTMLDivElement> = ({
    key,
  }) => {
    const daysToAdd = keyMap[key];
    if (focused && daysToAdd) {
      setFocused(addDays(daysToAdd, focused));
    }
  };

  return (
    <div className="datepicker" onKeyDown={handleKeyPress}>
      <div className="months-wrapper">
        <Month
          focused={focused}
          month={monthView}
          onDayFocus={setFocused}
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
          focused={focused}
          month={nextMonth}
          onDayFocus={setFocused}
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
  onDayFocus,
  focused,
}: {
  range: Range;
  month: Date;
  onSelect(x: Date): void;
  selected: Date | null;
  customHeader?: ReactNode;
  onDayFocus(d: Date): void;
  focused: Date | null;
}) => {
  const sm = startOfMonth(month);
  const sfw = startOfWeek(sm, { weekStartsOn: WEEK_STARTS_ON });
  const em = endOfMonth(sm);
  const elw = addDays(WEEK_STARTS_ON, endOfWeek(em));
  const totalDays = differenceInCalendarDays(sfw, elw) + 1;
  const days = times(identity, totalDays).map((_, idx) => addDays(idx, sfw));

  return (
    <div className="month-wrapper">
      <div className="month-title">
        {customHeader ? customHeader : format("MMM", sm)}
      </div>
      <div className="month">
        {splitEvery(7, days).map((week) => {
          return (
            <div className="week">
              {week.map((x) => (
                <Day
                  value={x}
                  month={month}
                  key={x.getTime()}
                  onSelect={onChange}
                  range={range}
                  selected={selected}
                  focused={focused}
                  onDayFocus={onDayFocus}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Day = ({
  value,
  month,
  onSelect: onChange,
  range: [start, end],
  selected,
  onDayFocus,
  focused,
}: {
  value: Date;
  month: Date;
  onSelect(x: Date): void;
  range: Range;
  selected: Date | null;
  onDayFocus(d: Date): void;
  focused: Date | null;
}) => {
  const today = isSameDay(value, new Date());
  const grayout = !isSameMonth(value, month);
  const weekend = isWeekend(value);
  const inRange = start && end && isWithinInterval({ start, end }, value);
  const isSelected = selected && isSameDay(selected, value);
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = ({
    key,
  }) => {
    switch (key) {
      case "Enter":
      case " ":
        onChange(value);
        break;
      default:
        break;
    }
  };
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      focused &&
      ref.current &&
      isSameDay(focused, value) &&
      !grayout &&
      document.activeElement !== ref.current
    ) {
      ref.current.focus();
    }
  }, [value, focused, grayout]);

  return (
    <div
      role="button"
      tabIndex={0}
      ref={ref}
      className={cx("day", {
        today,
        grayout,
        weekend,
        selected: isSelected,
        "in-range": inRange,
      })}
      onFocus={() => onDayFocus(value)}
      onKeyDown={handleKeyDown}
      onClick={() => onChange(value)}
    >
      {format("d", value)}
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
  const months = times(identity, 12).map((_, idx) => addMonths(idx, sy));
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
  const years = times(identity, 10).map((_, idx) => addYears(idx, fromYear));

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

export default App;
