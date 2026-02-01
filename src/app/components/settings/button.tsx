import React, { FC } from "react";
import styles from "../../styles/settings.module.css";
import { ButtonControlProps } from "../../types/settings";

const ButtonControl: FC<ButtonControlProps> = ({
  label,
  onClick,
  icon,
  alignment = "default",
  shortcut,
  triggeredKey,
  disabled = false,
}) => {
  const alignmentClass =
    alignment === "super" ? "setting__button-control--super" : "";

  return (
    <div className={styles.setting}>
      <div className={`setting__button-control ${alignmentClass}`}>
        <button
          title={label}
          onClick={() => onClick(label)}
          disabled={disabled}
        >
          {icon}
        </button>
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
    </div>
  );
};

export default ButtonControl;
