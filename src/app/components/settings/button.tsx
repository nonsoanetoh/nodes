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
  showLabel = false,
}) => {
  const alignmentClass =
    alignment === "super" ? "setting__button-control--super" : "";
  const withLabelClass = showLabel
    ? "setting__button-control--with-label"
    : "";

  return (
    <div className={styles.setting}>
      <div
        className={`setting__button-control ${alignmentClass} ${withLabelClass}`}
      >
        <button
          title={label}
          onClick={() => onClick(label)}
          disabled={disabled}
        >
          {icon}
          {showLabel && <span className={styles.buttonLabel}>{label}</span>}
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
