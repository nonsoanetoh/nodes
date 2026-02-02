# Test Plan for Nodes Animation Application

## Overview

This document outlines comprehensive unit and integration tests for the nodes animation application. Tests are organized by feature area and priority.

---

## 1. Project Management

### 1.1 Project Creation

- [ ] **UT-001**: `createEmptyProject()` creates project with default values
  - Default name is "Untitled"
  - Default canvas size is [500, 500]
  - Default node size is 40
  - Default draw mode is "Freehand"
  - 5 frames are created by default
  - All required fields are initialized

- [ ] **UT-002**: `createEmptyProject(name)` accepts custom name
  - Custom name is set correctly
  - Empty string defaults to "Untitled"

- [ ] **IT-001**: Creating new project finds empty slot
  - When slot 1 is empty, creates project in slot 1
  - When slot 1 is full, creates project in slot 2
  - When slots 1-2 are full, creates project in slot 3
  - When all slots are full, overwrites slot 1

- [ ] **IT-002**: Creating new project saves current project first
  - Current project is saved before creating new one
  - Switching back to previous slot restores original project

### 1.2 Project Deletion

- [ ] **IT-003**: Deleting current project clears slot
  - Slot is cleared in localStorage
  - Project data is removed

- [ ] **IT-004**: Deleting project switches to another if available
  - If other projects exist, switches to first available
  - If no other projects exist, creates new empty project
  - History is reset after switch

- [ ] **IT-005**: Deleting last project creates new empty project
  - New project is created with name "Untitled"
  - Current slot remains the same

### 1.3 Project Renaming

- [ ] **UT-003**: `updateProjectName()` updates project name
  - Name is updated in project state
  - Name persists after save

- [ ] **IT-006**: Renamed project persists across slot switches
  - Name is saved to localStorage
  - Name is restored when switching back to slot

### 1.4 Project Switching

- [ ] **IT-007**: Switching slots saves current project
  - Current project is saved before switch
  - Project can be restored by switching back

- [ ] **IT-008**: Switching slots loads correct project
  - Project from target slot is loaded
  - If slot is empty, creates new empty project

- [ ] **IT-009**: Switching slots resets history
  - Undo/redo history is cleared
  - `canUndo` and `canRedo` are false

- [ ] **IT-010**: Current slot persists across page reloads
  - Slot is saved to localStorage
  - Slot is restored on page load

### 1.5 Project Import/Export

- [ ] **UT-004**: `importProject()` validates project structure
  - Throws error for invalid project (no frames array)
  - Throws error for null/undefined project
  - Validates frames array exists

- [ ] **UT-005**: `importProject()` merges with defaults
  - Missing fields are filled with defaults
  - Existing fields are preserved
  - Name defaults to "Untitled" if missing

- [ ] **IT-011**: Importing project replaces current project
  - Current project is replaced
  - History is cleared
  - Project is saved to current slot

- [ ] **IT-012**: Exporting project creates valid JSON
  - JSON is valid and parseable
  - All project data is included
  - Can be imported back successfully

---

## 2. Node Operations

### 2.1 Node Creation

- [ ] **UT-006**: `createNode()` creates node with correct properties
  - Node has unique ID
  - Position (x, y) is set correctly
  - Size defaults to 1.0 if not provided
  - Image index is optional

- [ ] **UT-007**: `addNode()` adds node to current frame
  - Node is added to correct frame
  - Node count increases
  - Node has correct position

- [ ] **IT-013**: Adding node in Freehand mode creates multiple nodes
  - Nodes are spaced according to `freehandSpacing`
  - Multiple nodes created on drag

- [ ] **IT-014**: Adding node in Stamp mode creates single node
  - One node created per click
  - Node position matches click position

- [ ] **IT-015**: Adding node assigns image index based on shuffle type
  - "Sequential" assigns images in order
  - "Random" assigns random images
  - "Duplicate Repeats" repeats images

### 2.2 Node Movement

- [ ] **UT-008**: `updateNodePosition()` updates node position
  - Node position is updated
  - Other nodes are unaffected

- [ ] **IT-016**: Moving node in Edit mode updates position
  - Node follows mouse during drag
  - Position is saved on mouse up
  - History is saved

- [ ] **IT-017**: Moving node doesn't create new nodes
  - Node count remains same
  - Only position changes

### 2.3 Node Deletion

- [ ] **UT-009**: `removeNode()` removes node from frame
  - Node is removed from frame
  - Node count decreases
  - Other nodes are unaffected

- [ ] **IT-018**: Right-click deletes node
  - Context menu is prevented
  - Node is removed
  - History is saved

- [ ] **IT-019**: Delete key removes selected node
  - Node is removed on Delete keypress
  - Node is removed on Backspace keypress
  - Works when canvas is focused

### 2.4 Node Size Multiplier

- [ ] **UT-010**: `setNodeSizeMultiplier()` updates multiplier
  - Multiplier is updated in project
  - Affects all nodes in all frames

- [ ] **IT-020**: Node size multiplier affects rendering
  - Nodes render at correct size
  - Size changes are visible immediately

---

## 3. Frame Operations

### 3.1 Frame Creation

- [ ] **UT-011**: `createFrame()` creates frame with defaults
  - Frame has unique ID
  - Empty nodes array
  - Reference opacity is 100

- [ ] **UT-012**: `addFrame()` adds frame to project
  - Frame is added to frames array
  - Frame count increases
  - New frame is empty

- [ ] **IT-021**: Adding frame doesn't affect other frames
  - Existing frames remain unchanged
  - Nodes in other frames are preserved

### 3.2 Frame Deletion

- [ ] **UT-013**: `removeFrame()` removes frame
  - Frame is removed from array
  - Frame count decreases
  - Cannot remove last frame

- [ ] **IT-022**: Removing frame adjusts current frame index
  - If removed frame was current, moves to previous
  - If removed frame was before current, index adjusts

### 3.3 Frame Duplication

- [ ] **UT-014**: `duplicateFrame()` creates copy with new ID
  - New frame has different ID
  - All nodes are copied
  - Reference image is copied

- [ ] **IT-023**: Duplicated frame appears after original
  - Frame order is correct
  - Can be edited independently

### 3.4 Frame Switching

- [ ] **UT-015**: `setCurrentFrame()` updates current frame index
  - Index is updated
  - Index is clamped to valid range

- [ ] **IT-024**: Switching frames displays correct nodes
  - Nodes from selected frame are shown
  - Nodes from other frames are hidden

- [ ] **IT-025**: Frame navigation buttons work correctly
  - Previous button goes to previous frame
  - Next button goes to next frame
  - Buttons disabled at boundaries

---

## 4. Undo/Redo System

### 4.1 History Management

- [ ] **UT-016**: `saveToHistory()` saves project state
  - State is added to history
  - History size is limited to maxHistorySize (50)
  - Oldest entries are removed when limit exceeded

- [ ] **UT-017**: History only tracks node changes
  - Node additions save history
  - Node moves save history
  - Node deletions save history
  - Settings changes don't save history
  - Reference image changes don't save history

- [ ] **UT-018**: `undo()` restores previous state
  - Previous state is restored
  - Current state is moved to future
  - UI state (drawMode, currentFrameIndex) is preserved

- [ ] **UT-019**: `redo()` restores future state
  - Future state is restored
  - Current state is moved to history
  - UI state is preserved

- [ ] **IT-026**: Undo/redo flags update correctly
  - `canUndo` is true when history exists
  - `canRedo` is true when future exists
  - Flags update synchronously

- [ ] **IT-027**: Undo/redo preserves UI state
  - Draw mode is preserved
  - Current frame index is preserved
  - Node size multiplier is preserved
  - Playback state is preserved

---

## 5. Settings Management

### 5.1 Canvas Settings

- [ ] **UT-020**: Canvas size updates correctly
  - Size is updated in project
  - Canvas resizes accordingly

- [ ] **UT-021**: Background color updates correctly
  - Color is updated
  - Canvas background changes

- [ ] **UT-022**: Node color updates correctly
  - Color is updated
  - Nodes render with new color

### 5.2 Draw Mode

- [ ] **UT-023**: Draw mode switching works
  - "Freehand" mode enables freehand drawing
  - "Stamp" mode enables single-click placement
  - "Edit" mode enables node movement

- [ ] **IT-028**: Draw mode affects cursor style
  - Cursor changes based on mode
  - Cursor changes based on hover state

### 5.3 Image Library

- [ ] **UT-024**: Image library updates correctly
  - Images are added to library
  - Images are removed from library
  - Library persists across sessions

- [ ] **IT-029**: Changing image library reassigns images
  - All nodes get new image assignments
  - Assignment respects shuffle type
  - Old images are cleared

- [ ] **IT-030**: Show/hide images toggle works
  - Toggle shows/hides images on nodes
  - State persists across sessions

- [ ] **IT-031**: Image shuffle type affects assignment
  - "Sequential" assigns in order
  - "Random" assigns randomly
  - "Duplicate Repeats" repeats pattern

### 5.4 Export Quality

- [ ] **UT-025**: Export quality settings update
  - GIF quality (1-30) is saved
  - Video quality (0-1) is saved
  - Settings persist

### 5.5 Clip Mode

- [ ] **UT-026**: Clip mode toggle works
  - Mode is enabled/disabled
  - Background image is required when enabled

- [ ] **IT-032**: Clip mode hides reference image
  - Reference image is hidden when clip mode is on
  - Reference image shows when clip mode is off

- [ ] **IT-033**: Clip mode renders nodes as squares
  - Nodes are square in clip mode
  - Nodes reveal background image
  - Normal mode renders circles/images

---

## 6. Reference Image Management

### 6.1 Reference Image

- [ ] **UT-027**: `updateFrameReferenceImage()` updates image
  - Image is set for specific frame
  - Image can be cleared (set to null)
  - Other frames are unaffected

- [ ] **UT-028**: `updateFrameReferenceOpacity()` updates opacity
  - Opacity is updated (0-100)
  - Opacity is clamped to valid range

- [ ] **IT-034**: Reference image renders correctly
  - Image is displayed on canvas
  - Opacity affects visibility
  - Image is frame-specific

- [ ] **IT-035**: Reference image respects aspect ratio
  - Image maintains aspect ratio
  - Image fits within canvas

---

## 7. Animation Playback

### 7.1 Playback Control

- [ ] **UT-029**: `setIsPlaying()` toggles playback
  - Playback starts when set to true
  - Playback stops when set to false

- [ ] **IT-036**: Animation plays through frames
  - Frames advance automatically
  - Speed respects animationSpeed setting
  - Loops back to first frame

- [ ] **IT-037**: Animation stops correctly
  - Stops at current frame
  - Can be resumed from same frame

- [ ] **IT-038**: Animation speed affects playback
  - Higher speed plays faster
  - Lower speed plays slower

---

## 8. Export Functionality

### 8.1 GIF Export

- [ ] **UT-030**: `exportAsGIF()` creates GIF blob
  - Returns valid blob
  - Blob has correct MIME type
  - Progress callback is called

- [ ] **IT-039**: GIF export includes all frames
  - All frames are rendered
  - Frame order is correct
  - Quality setting is respected

- [ ] **IT-040**: GIF export handles images correctly
  - Images are loaded before export
  - Clip mode is handled correctly
  - Reference images are included

### 8.2 Video Export

- [ ] **UT-031**: `exportAsVideo()` creates video blob
  - Returns valid blob
  - Blob has correct MIME type
  - Progress callback is called

- [ ] **IT-041**: Video export includes all frames
  - All frames are rendered
  - Frame order is correct
  - Quality setting is respected

### 8.3 JSON Export

- [ ] **UT-032**: `exportAsJSON()` creates JSON string
  - Returns valid JSON
  - All project data is included
  - Can be parsed back

- [ ] **IT-042**: JSON export/import roundtrip
  - Exported JSON can be imported
  - All data is preserved
  - Project works after import

---

## 9. LocalStorage Persistence

### 9.1 Storage Operations

- [ ] **UT-033**: `saveProjectToSlot()` saves to localStorage
  - Project is saved correctly
  - Handles quota exceeded errors
  - Works in SSR environment

- [ ] **UT-034**: `loadProjectFromSlot()` loads from localStorage
  - Returns null for empty slots
  - Returns project for filled slots
  - Validates project structure

- [ ] **IT-043**: Projects persist across page reloads
  - All 3 slots persist
  - Current slot persists
  - Project data is restored correctly

- [ ] **IT-044**: Corrupted localStorage is handled
  - Invalid JSON is handled gracefully
  - Corrupted data doesn't crash app
  - Falls back to empty project

- [ ] **IT-045**: Storage quota exceeded is handled
  - Error is caught and logged
  - App continues to function
  - User is notified (if implemented)

---

## 10. Canvas Rendering

### 10.1 Node Rendering

- [ ] **IT-046**: Nodes render at correct positions
  - Positions match node data
  - Nodes are visible on canvas

- [ ] **IT-047**: Nodes render with correct size
  - Size respects nodeSize and multiplier
  - Size changes are visible

- [ ] **IT-048**: Nodes render with images
  - Images are loaded and displayed
  - Images respect aspect ratio
  - Images fit within node bounds

- [ ] **IT-049**: Nodes render with colors
  - Color is used when no image
  - Color matches nodeColor setting

### 10.2 Clip Mode Rendering

- [ ] **IT-050**: Clip mode renders squares
  - Nodes are square, not circular
  - Background image is revealed
  - Image loads before rendering

### 10.3 Canvas Interactions

- [ ] **IT-051**: Mouse interactions work correctly
  - Click detection is accurate
  - Drag detection works
  - Hover detection works

- [ ] **IT-052**: Canvas resizes correctly
  - Canvas adapts to container size
  - Aspect ratio is maintained
  - Drawing coordinates are correct

---

## 11. Component Integration

### 11.1 Header Component

- [ ] **IT-053**: Project dropdown shows current name
  - Name is displayed correctly
  - Name updates when changed
  - Handles hydration correctly

- [ ] **IT-054**: Export dropdown works
  - Dropdown opens/closes
  - Export options are clickable
  - Status indicator shows progress

- [ ] **IT-055**: Project management UI works
  - Create project prompts for name
  - Switch project shows other projects
  - Rename project updates name
  - Delete project confirms and deletes

### 11.2 Settings Pane

- [ ] **IT-056**: Settings update project state
  - Changes are reflected immediately
  - Settings persist across sessions
  - All input types work correctly

### 11.3 Timeline Pane

- [ ] **IT-057**: Frame navigation works
  - Frame buttons work correctly
  - Frame count is accurate
  - Current frame is highlighted

- [ ] **IT-058**: Animation controls work
  - Play button starts animation
  - Pause button stops animation
  - Frame navigation works during playback

---

## 12. Edge Cases & Error Handling

### 12.1 Invalid Input

- [ ] **EC-001**: Invalid project import is handled
  - Error is thrown for invalid JSON
  - Error is thrown for missing fields
  - App doesn't crash

- [ ] **EC-002**: Invalid image files are handled
  - Invalid images don't crash app
  - Error is logged
  - App continues to function

### 12.2 Boundary Conditions

- [ ] **EC-003**: Empty project handles correctly
  - No nodes doesn't crash
  - No frames doesn't crash
  - Empty image library works

- [ ] **EC-004**: Maximum values are handled
  - Large node counts work
  - Many frames work
  - Large images are handled

### 12.3 State Consistency

- [ ] **EC-005**: State remains consistent
  - No orphaned nodes
  - No invalid frame indices
  - No invalid image indices

---

## 13. Performance Tests

### 13.1 Rendering Performance

- [ ] **PERF-001**: Canvas renders efficiently
  - 100+ nodes render smoothly
  - Frame switching is fast
  - Animation playback is smooth

- [ ] **PERF-002**: Image loading is efficient
  - Images are cached
  - Images load asynchronously
  - No memory leaks

### 13.2 Storage Performance

- [ ] **PERF-003**: localStorage operations are fast
  - Saving doesn't block UI
  - Loading is quick
  - Large projects work

---

## Test Implementation Priority

### High Priority (Critical Path)

1. Project creation, deletion, switching
2. Node operations (add, move, delete)
3. Undo/redo functionality
4. LocalStorage persistence
5. Export functionality

### Medium Priority (Important Features)

1. Frame operations
2. Settings management
3. Image library management
4. Animation playback
5. Clip mode

### Low Priority (Nice to Have)

1. Performance tests
2. Edge cases
3. Component integration details

---

## Test Tools & Setup

### Recommended Testing Stack

- **Unit Tests**: Vitest or Jest
- **Integration Tests**: React Testing Library
- **E2E Tests**: Playwright or Cypress
- **Mocking**: MSW (Mock Service Worker) for localStorage

### Test Utilities Needed

- Mock localStorage implementation
- Mock canvas context
- Mock image loading
- Mock file reading/writing

---

## Notes

- All tests should be deterministic (no random values without seeds)
- Tests should clean up after themselves (clear localStorage, etc.)
- Tests should be isolated (don't depend on execution order)
- Consider snapshot testing for complex UI states
- Add visual regression tests for canvas rendering
