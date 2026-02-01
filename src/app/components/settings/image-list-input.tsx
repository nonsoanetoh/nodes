"use client";
import React, { FC, useRef, useState, useEffect } from "react";
import Image from "next/image";
import styles from "../../styles/settings.module.css";
import { ImageListInputProps } from "../../types/settings";

const ImageListInput: FC<ImageListInputProps> = ({
  label,
  value = [],
  onChange,
  showImages = true,
  onShowImagesChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [images, setImages] = useState<string[]>(value);

  useEffect(() => {
    setImages(value);
  }, [value]);

  const handleLocalImageClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages: string[] = [];
    let processed = 0;

    files.forEach((file) => {
      if (images.length + newImages.length >= 20) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result as string);
        processed++;

        if (processed === Math.min(files.length, 20 - images.length)) {
          const updatedImages = [...images, ...newImages].slice(0, 20);
          setImages(updatedImages);
          onChange(updatedImages);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim() && images.length < 20) {
      const updatedImages = [...images, urlInput.trim()].slice(0, 20);
      setImages(updatedImages);
      onChange(updatedImages);
      setUrlInput("");
      setShowUrlInput(false);
    }
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleUrlSubmit();
    } else if (e.key === "Escape") {
      setShowUrlInput(false);
      setUrlInput("");
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onChange(updatedImages);
  };

  return (
    <div className={styles.setting}>
      <div className="setting__image-list-input">
        <div className="row">
          <label className="setting__label">{label}</label>
          {onShowImagesChange && (
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                checked={showImages}
                onChange={(e) => onShowImagesChange(e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          )}
        </div>

        <div className="add-buttons">
          <button
            type="button"
            className="add-button"
            onClick={handleLocalImageClick}
          >
            + add local image
          </button>
          {!showUrlInput ? (
            <button
              type="button"
              className="add-button"
              onClick={() => setShowUrlInput(true)}
            >
              + add image from url
            </button>
          ) : (
            <div className="url-input-container">
              <input
                type="text"
                className="url-input"
                placeholder="Paste image URL"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={handleUrlKeyDown}
                onBlur={handleUrlSubmit}
                autoFocus
              />
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        <div className="image-grid">
          {images.map((imageUrl, index) => (
            <div key={index} className="image-grid-item">
              <Image
                src={imageUrl}
                alt={`${label} ${index + 1}`}
                width={64}
                height={64}
                unoptimized
                className="grid-image"
              />
              <button
                type="button"
                className="remove-image"
                onClick={() => handleRemoveImage(index)}
                aria-label="Remove image"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 3L3 9M3 3L9 9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageListInput;
