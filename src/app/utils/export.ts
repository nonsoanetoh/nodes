import { Project, Frame, Node } from "../types/project";

// Dynamic import for gif.js (client-side only)
async function getGIFConstructor() {
  if (typeof window === "undefined") {
    throw new Error("GIF export is only available in the browser");
  }

  // @ts-ignore - gif.js doesn't have proper TypeScript definitions
  const gifModule = await import("gif.js");

  // gif.js uses UMD format - try different ways to access the constructor
  let GIF: any;

  // Try default export first
  if (gifModule.default && typeof gifModule.default === "function") {
    GIF = gifModule.default;
  }
  // Try direct module export
  else if (typeof gifModule === "function") {
    GIF = gifModule;
  }
  // Try accessing via window (UMD fallback)
  else if (typeof window !== "undefined" && (window as any).GIF) {
    GIF = (window as any).GIF;
  }
  // Try named export
  else if (gifModule.GIF && typeof gifModule.GIF === "function") {
    GIF = gifModule.GIF;
  } else {
    // Last resort: try accessing the module.exports directly
    const moduleExports = (gifModule as any).__esModule
      ? gifModule.default
      : gifModule;
    GIF = moduleExports;
  }

  // Ensure it's a constructor
  if (typeof GIF !== "function") {
    console.error("GIF module structure:", gifModule);
    throw new Error(`Failed to load GIF constructor. Got type: ${typeof GIF}`);
  }

  return GIF;
}

// Render a single frame to a canvas
export async function renderFrameToCanvas(
  frame: Frame,
  project: Project,
  width: number,
  height: number,
  imageMap?: Map<string, HTMLImageElement>,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  // Draw background
  ctx.fillStyle = project.backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Draw reference image if it exists
  if (frame.referenceImage) {
    const img =
      imageMap?.get(frame.referenceImage) ||
      (await loadImage(frame.referenceImage));
    ctx.save();
    ctx.globalAlpha = (frame.referenceOpacity || 100) / 100;
    ctx.drawImage(img, 0, 0, width, height);
    ctx.restore();
  }

  // Draw nodes
  const baseNodeSize = project.nodeSize * project.nodeSizeMultiplier;
  frame.nodes.forEach((node) => {
    drawNode(
      ctx,
      node,
      baseNodeSize,
      project.nodeColor,
      project.imageLibrary,
      width,
      height,
      project.showImages,
      imageMap,
    );
  });

  return canvas;
}

// Helper to load an image
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Draw a single node
function drawNode(
  ctx: CanvasRenderingContext2D,
  node: Node,
  baseNodeSize: number,
  nodeColor: string,
  imageLibrary: string[],
  canvasWidth: number,
  canvasHeight: number,
  showImages: boolean,
  imageMap?: Map<string, HTMLImageElement>,
) {
  const pixelX = node.x * canvasWidth;
  const pixelY = node.y * canvasHeight;
  const nodeSize = baseNodeSize * node.size;
  const nodeX = pixelX - nodeSize / 2;
  const nodeY = pixelY - nodeSize / 2;

  // Draw image if available and images are enabled, otherwise draw solid color
  if (
    project.showImages &&
    node.imageIndex !== undefined &&
    imageLibrary[node.imageIndex]
  ) {
    const imageUrl = imageLibrary[node.imageIndex];
    const img = imageMap?.get(imageUrl);
    if (img && img.complete) {
      // Draw image with aspect ratio preserved
      const imgAspectRatio = img.width / img.height;
      let drawWidth = nodeSize;
      let drawHeight = nodeSize;
      let drawX = nodeX;
      let drawY = nodeY;

      // Calculate dimensions to fit within nodeSize while preserving aspect ratio
      if (imgAspectRatio > 1) {
        // Image is wider than tall
        drawHeight = nodeSize / imgAspectRatio;
        drawY = nodeY + (nodeSize - drawHeight) / 2;
      } else {
        // Image is taller than wide or square
        drawWidth = nodeSize * imgAspectRatio;
        drawX = nodeX + (nodeSize - drawWidth) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    } else {
      ctx.fillStyle = nodeColor;
      ctx.fillRect(nodeX, nodeY, nodeSize, nodeSize);
    }
  } else {
    ctx.fillStyle = nodeColor;
    ctx.fillRect(nodeX, nodeY, nodeSize, nodeSize);
  }
}

// Export animation as GIF
export async function exportAsGIF(
  project: Project,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const [canvasWidth, canvasHeight] = project.canvasSize;

  // Dynamically import GIF constructor
  const GIF = await getGIFConstructor();

  // @ts-ignore - gif.js types are not perfect
  const gif = new GIF({
    workers: 2,
    quality: project.exportQualityGIF,
    width: canvasWidth,
    height: canvasHeight,
    repeat: 0, // Loop forever
    workerScript: "/gif.worker.js",
  });

  // Load all images first
  const imagePromises: Promise<HTMLImageElement>[] = [];
  const imageMap = new Map<string, HTMLImageElement>();

  // Collect all unique image URLs
  const imageUrls = new Set<string>();
  project.frames.forEach((frame) => {
    if (frame.referenceImage) {
      imageUrls.add(frame.referenceImage);
    }
    frame.nodes.forEach((node) => {
      if (
        node.imageIndex !== undefined &&
        project.imageLibrary[node.imageIndex]
      ) {
        imageUrls.add(project.imageLibrary[node.imageIndex]);
      }
    });
  });

  // Load all images
  for (const url of imageUrls) {
    imagePromises.push(
      loadImage(url).then((img) => {
        imageMap.set(url, img);
        return img;
      }),
    );
  }

  await Promise.all(imagePromises);

  // Render each frame
  for (let i = 0; i < project.frames.length; i++) {
    const frame = project.frames[i];
    const canvas = await renderFrameToCanvas(
      frame,
      project,
      canvasWidth,
      canvasHeight,
      imageMap,
    );

    // Calculate delay based on animation speed
    // animationSpeed is frames per second, so delay per frame = 1000ms / fps
    const delay = 1000 / project.animationSpeed;
    gif.addFrame(canvas, { delay });

    onProgress?.((i + 1) / project.frames.length);
  }

  return new Promise((resolve, reject) => {
    gif.on("finished", (blob: Blob) => {
      resolve(blob);
    });
    gif.on("progress", (p: number) => {
      onProgress?.(p);
    });
    gif.render();
  });
}

// Export animation as video (MP4)
export async function exportAsVideo(
  project: Project,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const [canvasWidth, canvasHeight] = project.canvasSize;

  // Create a temporary canvas for recording
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  // Get canvas stream
  const stream = canvas.captureStream(project.animationSpeed); // fps

  // Configure MediaRecorder with quality settings
  const options: MediaRecorderOptions = {
    mimeType: "video/webm;codecs=vp9",
  };

  // Add videoBitsPerSecond if supported (quality control)
  if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
    // Calculate bitrate based on quality (0-1) and canvas size
    const baseBitrate = canvasWidth * canvasHeight * project.animationSpeed;
    const bitrate = Math.floor(baseBitrate * project.exportQualityVideo);
    options.videoBitsPerSecond = bitrate;
  }

  const mediaRecorder = new MediaRecorder(stream, options);

  const chunks: Blob[] = [];

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  return new Promise(async (resolve, reject) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      resolve(blob);
    };

    mediaRecorder.onerror = (event) => {
      reject(event);
    };

    // Load all images first
    const imageMap = new Map<string, HTMLImageElement>();
    const imageUrls = new Set<string>();
    project.frames.forEach((frame) => {
      if (frame.referenceImage) {
        imageUrls.add(frame.referenceImage);
      }
      frame.nodes.forEach((node) => {
        if (
          node.imageIndex !== undefined &&
          project.imageLibrary[node.imageIndex]
        ) {
          imageUrls.add(project.imageLibrary[node.imageIndex]);
        }
      });
    });

    const imagePromises = Array.from(imageUrls).map((url) =>
      loadImage(url).then((img) => {
        imageMap.set(url, img);
        return img;
      }),
    );

    await Promise.all(imagePromises);

    mediaRecorder.start();

    // Render each frame
    const frameDuration = 1000 / project.animationSpeed; // milliseconds per frame

    for (let i = 0; i < project.frames.length; i++) {
      const frame = project.frames[i];

      // Clear canvas
      ctx.fillStyle = project.backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw reference image
      if (frame.referenceImage) {
        const img = imageMap.get(frame.referenceImage);
        if (img) {
          ctx.save();
          ctx.globalAlpha = (frame.referenceOpacity || 100) / 100;
          ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
          ctx.restore();
        }
      }

      // Draw nodes
      const baseNodeSize = project.nodeSize * project.nodeSizeMultiplier;
      frame.nodes.forEach((node) => {
        const pixelX = node.x * canvasWidth;
        const pixelY = node.y * canvasHeight;
        const nodeSize = baseNodeSize * node.size;
        const nodeX = pixelX - nodeSize / 2;
        const nodeY = pixelY - nodeSize / 2;

        // Draw node image if available and images are enabled
        if (
          project.showImages &&
          node.imageIndex !== undefined &&
          project.imageLibrary[node.imageIndex]
        ) {
          const imageUrl = project.imageLibrary[node.imageIndex];
          const img = imageMap.get(imageUrl);
          if (img && img.complete) {
            // Draw image with aspect ratio preserved
            const imgAspectRatio = img.width / img.height;
            let drawWidth = nodeSize;
            let drawHeight = nodeSize;
            let drawX = nodeX;
            let drawY = nodeY;

            // Calculate dimensions to fit within nodeSize while preserving aspect ratio
            if (imgAspectRatio > 1) {
              // Image is wider than tall
              drawHeight = nodeSize / imgAspectRatio;
              drawY = nodeY + (nodeSize - drawHeight) / 2;
            } else {
              // Image is taller than wide or square
              drawWidth = nodeSize * imgAspectRatio;
              drawX = nodeX + (nodeSize - drawWidth) / 2;
            }

            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
          } else {
            ctx.fillStyle = project.nodeColor;
            ctx.fillRect(nodeX, nodeY, nodeSize, nodeSize);
          }
        } else {
          ctx.fillStyle = project.nodeColor;
          ctx.fillRect(nodeX, nodeY, nodeSize, nodeSize);
        }
      });

      onProgress?.((i + 1) / project.frames.length);

      // Wait for frame duration before next frame
      await new Promise((resolve) => setTimeout(resolve, frameDuration));
    }

    // Stop recording after a short delay to ensure last frame is captured
    setTimeout(() => {
      mediaRecorder.stop();
      stream.getTracks().forEach((track) => track.stop());
    }, frameDuration);
  });
}

// Download a blob as a file
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
