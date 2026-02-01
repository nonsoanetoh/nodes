import React, { FC, useState } from "react";
import styles from "../../styles/settings.module.css";
import { ColorInputProps } from "../../types/settings";

const ColorInput: FC<ColorInputProps> = ({ label, value, onChange }) => {
  const [inputValue, setInputValue] = useState<string>(value);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(inputValue);
  };

  return (
    <div className={styles.setting}>
      <div className="setting__color-input">
        <label htmlFor={`${label}--ci`} className="setting__label">
          {label}
        </label>
        <div className="input-container">
          <div className="setting__color-input">
            <input
              id={`${label}--ci`}
              type="color"
              defaultValue={value}
              onChange={(e) => handleInputChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorInput;
