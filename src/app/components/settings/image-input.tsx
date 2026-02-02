"use client";
import React, { FC, useRef, useState } from "react";
import Image from "next/image";
import styles from "../../styles/settings.module.css";
import { ImageInputProps } from "../../types/settings";
import AddImage from "../icons/add-image";
import Remove from "../icons/remove";

const ImageInput: FC<ImageInputProps> = ({ label, value, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  const previewUrl = value || localPreviewUrl;

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLocalPreviewUrl(null);
    }
    onChange(file);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the file input
    setLocalPreviewUrl(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={styles.setting}>
      <div className="setting__image-input">
        <label htmlFor={`${label}--ii`} className="setting__label">
          {label}
        </label>
        <div className="input-container" onClick={handleClick}>
          <input
            ref={fileInputRef}
            id={`${label}--ii`}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          {previewUrl ? (
            <div style={{ position: "relative", display: "inline-block" }}>
              <Image
                src={previewUrl}
                alt={label}
                className="image-preview"
                width={32}
                height={32}
                unoptimized
              />
              <button
                type="button"
                onClick={handleRemove}
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  background: "white",
                  border: "1px solid #ccc",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: 0,
                }}
                title="Remove image"
              >
                <Remove />
              </button>
            </div>
          ) : (
            <div className="image-placeholder">
              <AddImage />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageInput;
