"use client";
import React, { FC, useRef, useState } from "react";
import Image from "next/image";
import styles from "../../styles/settings.module.css";
import { ImageInputProps } from "../../types/settings";
import AddImage from "../icons/add-image";

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
            <Image
              src={previewUrl}
              alt={label}
              className="image-preview"
              width={32}
              height={32}
              unoptimized
            />
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
