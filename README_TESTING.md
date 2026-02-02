# Testing Setup Guide

This project uses **Vitest** for unit and integration testing with **React Testing Library** for component testing.

## Installation

Install the testing dependencies:

```bash
npm install --save-dev vitest @vitest/ui @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Run tests once (for CI)
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## Test Structure

```
src/
  test/
    setup.ts              # Test configuration and mocks
    utils.tsx             # Testing utilities and helpers
    mocks/
      localStorage.ts     # localStorage mocks
      canvas.ts           # Canvas mocks
  app/
    types/
      project.test.ts     # Example test file
```

## Writing Tests

### Unit Tests

Test individual functions and utilities:

```typescript
import { describe, it, expect } from "vitest";
import { createEmptyProject } from "./project";

describe("createEmptyProject", () => {
  it("creates project with default values", () => {
    const project = createEmptyProject();
    expect(project.name).toBe("Untitled");
  });
});
```

### Integration Tests

Test component interactions:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "../test/utils";
import Header from "../components/header";

describe("Header", () => {
  it("displays project name", () => {
    render(<Header />);
    expect(screen.getByText("Untitled")).toBeInTheDocument();
  });
});
```

## Test Utilities

### Custom Render

Use the custom render function from `test/utils` to include providers:

```typescript
import { render } from "../test/utils";

render(<MyComponent />);
```

### Mock Data Helpers

```typescript
import { createMockProject, createMockNode, createMockFrame } from "../test/utils";

const project = createMockProject({ name: "Test" });
const node = createMockNode({ x: 100, y: 200 });
const frame = createMockFrame({ nodes: [node] });
```

## Mocking

### localStorage

localStorage is automatically mocked in `test/setup.ts`. Use it directly:

```typescript
localStorage.setItem("key", "value");
expect(localStorage.getItem("key")).toBe("value");
```

### Canvas

Canvas context is automatically mocked. Use `createMockCanvas()` for more control:

```typescript
import { createMockCanvas } from "../test/mocks/canvas";

const { canvas, context } = createMockCanvas();
```

## Test Coverage

Coverage reports are generated in the `coverage/` directory. Open `coverage/index.html` in a browser to view the report.

## Best Practices

1. **Isolate tests**: Each test should be independent
2. **Clean up**: Tests automatically clean up after themselves
3. **Use descriptive names**: Test names should describe what they test
4. **Follow the test plan**: Reference `TEST_PLAN.md` for comprehensive test cases
5. **Mock external dependencies**: Mock localStorage, canvas, and other browser APIs

## Common Patterns

### Testing Hooks

```typescript
import { renderHook } from "@testing-library/react";
import { useProject } from "../hooks/useProject";

const { result } = renderHook(() => useProject());
expect(result.current.project.name).toBe("Untitled");
```

### Testing User Interactions

```typescript
import userEvent from "@testing-library/user-event";

const user = userEvent.setup();
await user.click(screen.getByRole("button"));
```

### Testing Async Operations

```typescript
import { waitFor } from "@testing-library/react";

await waitFor(() => {
  expect(screen.getByText("Loaded")).toBeInTheDocument();
});
```
