# Commit Plan for Clip Mode and Image Management Features

## Clip Mode Foundation

1. **add: clip mode properties to project type**
   - `src/app/types/project.ts` (clipMode, clipBackgroundImage)

2. **update: initialize clip mode in empty project**
   - `src/app/types/project.ts` (createEmptyProject default values)

## Image Input Improvements

3. **feat: add remove button to image input component**
   - `src/app/components/settings/image-input.tsx` (remove button UI)

4. **update: handle image removal in image input**
   - `src/app/components/settings/image-input.tsx` (handleRemove function, file input reset)

## Clip Mode Settings

5. **feat: add clip mode toggle to settings pane**
   - `src/app/components/settings-pane.tsx` (RadioInput for clip mode)

6. **feat: add clip background image input to settings pane**
   - `src/app/components/settings-pane.tsx` (ImageInput for background image, conditional rendering)

7. **update: add clip mode change handler**
   - `src/app/components/settings-pane.tsx` (handleClipModeChange)

8. **update: add clip background image change handler**
   - `src/app/components/settings-pane.tsx` (handleClipBackgroundImageChange)

## Canvas Clip Mode Rendering

9. **feat: load clip background image in canvas**
   - `src/app/components/canvas.tsx` (image loading and caching logic)

10. **feat: implement square clip paths for nodes in clip mode**
    - `src/app/components/canvas.tsx` (drawNode clip mode logic with square paths)

11. **update: add clip mode dependencies to canvas effect**
    - `src/app/components/canvas.tsx` (dependency array updates)

## Export Clip Mode Support

12. **feat: load clip background image in renderFrameToCanvas**
    - `src/app/utils/export.ts` (clip image loading in renderFrameToCanvas)

13. **feat: add clip mode support to drawNode helper**
    - `src/app/utils/export.ts` (drawNode function clip mode logic)

14. **update: add clip background image to GIF export image collection**
    - `src/app/utils/export.ts` (imageUrls collection in exportAsGIF)

15. **update: add clip background image to video export image collection**
    - `src/app/utils/export.ts` (imageUrls collection in exportAsVideo)

16. **feat: implement square clip paths in video export**
    - `src/app/utils/export.ts` (video export node rendering with clip mode)

## Reference Image Hiding

17. **feat: hide reference image controls when clip mode enabled**
    - `src/app/components/timeline-pane.tsx` (conditional rendering)

18. **feat: hide reference image rendering when clip mode enabled**
    - `src/app/components/canvas.tsx` (conditional rendering in canvas)

19. **feat: hide reference image in renderFrameToCanvas when clip mode enabled**
    - `src/app/utils/export.ts` (conditional rendering in renderFrameToCanvas)

20. **feat: hide reference image in video export when clip mode enabled**
    - `src/app/utils/export.ts` (conditional rendering in video export)

## New Project Feature

21. **feat: add resetProject function to useProject hook**
    - `src/app/hooks/useProject.ts` (resetProject function)

22. **update: export resetProject from useProject hook**
    - `src/app/hooks/useProject.ts` (return statement)

23. **feat: add new project button to header**
    - `src/app/components/header.tsx` (New Project button UI)

24. **update: add resetProject to header context**
    - `src/app/components/header.tsx` (useProjectContext destructuring)

25. **update: add confirmation dialog for new project**
    - `src/app/components/header.tsx` (onClick handler with confirm)
