"use client";
import React, { FC, useState, useEffect } from "react";
import styles from "../../styles/settings.module.css";
import { DuoInputProps } from "../../types/settings";

const DuoInput: FC<DuoInputProps> = ({ label, values, onChange }) => {
  const [inputValues, setInputValues] = useState<[number, number]>(values);

  useEffect(() => {
    setInputValues(values);
  }, [values]);

  const handleInputChange = (index: 0 | 1, value: string) => {
    if (value.length > 4) {
      return;
    }
    const numValue = value === "" ? 0 : Number(value);
    const newValues: [number, number] = [...inputValues] as [number, number];
    newValues[index] = numValue;
    setInputValues(newValues);
    onChange(newValues);
  };

  return (
    <div className={`${styles.setting}`}>
      <div className="setting__duo-input">
        <label htmlFor={`${label}--di--1`} className="setting__label">
          {label}
        </label>
        <div className="input-container">
          <input
            id={`${label}--di--1`}
            type="number"
            value={inputValues[0] || ""}
            onChange={(e) => handleInputChange(0, e.target.value)}
          />
          <span className="input-separator">×</span>
          <input
            id={`${label}--di--2`}
            type="number"
            value={inputValues[1] || ""}
            onChange={(e) => handleInputChange(1, e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default DuoInput;
