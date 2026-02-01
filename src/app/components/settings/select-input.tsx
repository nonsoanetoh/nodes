"use client";
import React, { FC } from "react";
import styles from "../../styles/settings.module.css";
import { SelectInputProps } from "../../types/settings";

const SelectInput: FC<SelectInputProps> = ({
  label,
  value,
  options,
  onChange,
}) => {
  const currentValue = value || options[0] || "";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={styles.setting}>
      <div className="setting__select-input">
        <label htmlFor={`${label}--si`} className="setting__label">
          {label}
        </label>
        <div className="input-container">
          <select
            id={`${label}--si`}
            value={currentValue}
            onChange={handleChange}
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default SelectInput;
