import React, { FC } from "react";
import styles from "../../styles/settings.module.css";
import { RadioInputProps } from "../../types/settings";

const RadioInput: FC<RadioInputProps> = ({
  label,
  values,
  value,
  shortcut,
  triggeredKey,
  onChange,
}) => {
  const toggleMode = () => {
    const currentIndex = values.indexOf(value);
    const nextIndex = (currentIndex + 1) % values.length;
    onChange(values[nextIndex]);
  };

  return (
    <div className={`${styles.setting}`}>
      <div className="setting__radio-input">
        <div className="row">
          <span className="setting__label">{label}</span>
          {shortcut && (
            <div className="setting__shortcut-indicator">
              {shortcut.map((key, i) => {
                return (
                  <span
                    key={i}
                    className={triggeredKey === key ? "triggered" : ""}
                  >
                    {key}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <fieldset className="input-container">
          {values.map((val, i) => {
            return (
              <div className="field" key={i}>
                <input
                  type="radio"
                  id={`${label}--ri--${i + 1}`}
                  name={label}
                  value={val}
                  checked={value === val}
                  onChange={() => onChange(val)}
                />
                <label
                  className="setting__label"
                  htmlFor={`${label}--ri--${i + 1}`}
                >
                  {val}
                </label>
              </div>
            );
          })}
        </fieldset>
      </div>
    </div>
  );
};

export default RadioInput;
