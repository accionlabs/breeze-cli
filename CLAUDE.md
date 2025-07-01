# Next.js Project Development Guidelines

## 📁 Project Structure

```
/src
  /components     # Reusable React components
    /ui           # Basic UI components (buttons, inputs, etc.)
    /forms        # Form-specific components
    /layout       # Layout components (header, footer, sidebar)
    /common       # Shared components across pages
  /pages          # Next.js pages (route-based)
  /hooks          # Custom React hooks
  /utils          # Utility functions
  /types          # TypeScript type definitions
  /constants      # Constants and enums
  /lib            # External library configurations
  /styles         # Global styles and theme
  /services       # API services
/public
  /assets
    /icons        # SVG icons
    /images       # Images and graphics
    /videos       # Video files
/tests            # Test files
/__tests__        # Jest test files
```

## 🛠 Technology Stack

- **Next.js**: 15.0 (App Router)
- **React**: 19.0
- **TypeScript**: 5.x
- **Tailwind CSS**: 4.x
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier

## 🎯 Project-wide Standards

### Code Style

- Follow **BEM naming convention** for custom CSS classes
- Use **functional components** with TypeScript interfaces
- Implement **proper TypeScript generics** for reusable components
- Follow **Next.js 15 conventions** (App Router preferred)
- Use **server components** by default, client components when needed

### Image & Icon Handling

- **Icons**: Create as separate SVG files in `/public/assets/icons/`
- **Images**: Use Next.js `<Image />` component with proper optimization
- **No inline SVGs** in components (extract to files)

## 🧩 Component Development Standards

### Component Structure Requirements

```tsx
// Example component structure
interface ComponentNameProps {
  // Props with proper TypeScript types
  title: string;
  isActive?: boolean;
  onAction?: (id: string) => void;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  title,
  isActive = false,
  onAction,
}) => {
  // Component logic
  return <div className="component-name">{/* Component JSX */}</div>;
};

export default ComponentName;
```

### Component Guidelines

- **Location**: Place in `/src/components/{ComponentName}/{ComponentName}.tsx`
- **Props**: Always use TypeScript interfaces for props validation
- **Sizing**: Never hardcode height/width values
- **Reusability**: Check existing components before creating new ones
- **Testing**: Write comprehensive test cases for each component
- **Documentation**: Include JSDoc comments for complex components

### Component Organization

```
/components
  /Button
    Button.tsx
    Button.test.tsx
    Button.stories.tsx (if using Storybook)
    index.ts
```

## 🎨 Tailwind CSS v4 Theme Standards (STRICT)

### 1. Color Management Rules

✅ **MANDATORY**: Use only theme-defined colors
⛔️ **FORBIDDEN**: Hardcoded color values

### 2. Tailwind v4 Theme Configuration

Tailwind v4 uses CSS custom properties with `@theme` directive:

```css
/* src/styles/theme.css */
@import "tailwindcss";

@theme {
  --color-brand-primary: #226ce0;
  --color-brand-secondary: #3abff8;
  --color-surface-muted: #f8f9fa;
  --font-family-heading: Poppins, system-ui, sans-serif;
  --spacing-18: 4.5rem;
  --radius-xl: 1rem;
  --shadow-soft: 0 2px 15px rgba(0, 0, 0, 0.08);
}
```

### 3. Next.js Integration

```js
// tailwind.config.js (minimal config for v4)
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // No theme configuration needed - handled in CSS
};
```

```tsx
// app/layout.tsx or pages/_app.tsx
import "../styles/theme.css"; // Import your theme CSS

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### 7. Styling Guidelines

- **No inline styles** except for dynamic values or unsupported properties
- **Use CSS Grid/Flexbox** utilities over custom CSS
- **Consistent spacing** using theme-defined values
- **Proper focus states** for all interactive elements
- **Responsive design** using Tailwind breakpoints
- **Theme variables** take precedence over arbitrary values

### 4. Theme Variable Usage

```tsx
// ✅ Correct - Using theme variables
<div className="bg-brand-primary text-white rounded-xl p-4 shadow-soft">
  <h2 className="font-heading font-semibold text-lg">Title</h2>
  <p className="text-surface-muted">Description</p>
</div>

// ✅ Also correct - Default Tailwind classes
<div className="bg-blue-500 text-white rounded-lg p-4">
  <h2 className="font-sans font-semibold text-lg">Title</h2>
</div>

// ❌ Incorrect - Hardcoded values
<div style={{backgroundColor: '#226ce0'}} className="bg-[#226ce0]">
  Content
</div>
```

### 5. Color Implementation Workflow for v4

1. **Check existing colors** in default Tailwind palette
2. **Use default class** if color exists (e.g., `bg-blue-500`)
3. **Add to theme CSS** if color doesn't exist:
   ```css
   @theme {
     --color-custom-name: #hexvalue;
   }
   ```
4. **Use custom class** in components: `bg-custom-name`

### 6. Dynamic Theme Support

```css
/* Light/Dark mode support */
@media (prefers-color-scheme: dark) {
  @theme {
    --color-bg-primary: #1f2937;
    --color-text-primary: #f9fafb;
  }
}
```

## 📄 Page Development Guidelines

### Page Structure

- **Location**: `/src/pages/` or `/src/app/` (App Router)
- **Reuse components**: Always check `/src/components/` first
- **Create reusable components** when building page-specific elements
- **Server-side rendering**: Use appropriate Next.js rendering methods

### Page Organization

```tsx
// app/dashboard/page.tsx
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      <PageHeader title="Dashboard" />
      <DashboardStats />
    </div>
  );
}
```

## 📝 Type Management System (STRICT ENFORCEMENT)

### Type Organization Rules

⛔️ **FORBIDDEN**: Defining interfaces/types locally in components, pages, or API files
✅ **MANDATORY**: All types must be in dedicated `/src/types/` files

```
/src/types/
  index.ts          # Main type exports
  user.ts           # User-related types
  product.ts        # Product-related types
  api.ts            # API response types
  common.ts         # Shared utility types
```

### Type Definition Standards

```tsx
// types/user.ts
export interface User {
  id: string;
  email: string;
  profile: UserProfile;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
}

export type UserRole = "admin" | "user" | "moderator";

// types/index.ts - Centralized exports
export * from "./user";
export * from "./product";
export * from "./api";
export * from "./common";

// Usage in components - ALWAYS import from types
import { User, UserRole } from "@/types";
// OR
import { User, UserRole } from "@/types/user";
```

### Type Guidelines (STRICT)

- **No local definitions**: Never define interfaces in component files
- **Centralized location**: All types in `/src/types/` directory
- **Single source of truth**: Each type defined only once
- **Proper imports**: Always import from `/types/` directory
- **Generic patterns**: Use generics for reusable type structures

### ❌ Violations (FORBIDDEN)

```tsx
// ❌ WRONG - Local interface definition
const UserCard = () => {
  interface LocalUser {
    // THIS IS FORBIDDEN
    id: string;
    name: string;
  }

  return <div>...</div>;
};

// ❌ WRONG - Type defined in component file
type ComponentProps = {
  // THIS IS FORBIDDEN
  title: string;
};
```

### ✅ Correct Implementation

```tsx
// ✅ CORRECT - Import from types directory
import { User, UserCardProps } from "@/types";

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  return <div>...</div>;
};
```

## 🔧 Services & Business Logic Integration

Create fetch functions for each type of services.
Use hooks to use these services into componments efficiently.

Create services in services folder

## 🔧 Constants & Mock Data Management (STRICT ENFORCEMENT)

### Constants Organization Rules

⛔️ **FORBIDDEN**: Defining constants or mock data locally in components, pages, or API files
✅ **MANDATORY**: All constants and mock data must be in dedicated `/src/constants/` files

```
/src/constants/
  index.ts          # Main constants export
  api.ts            # API endpoints and configuration
  ui.ts             # UI-related constants
  validation.ts     # Validation rules and patterns
  mockData.ts       # Mock data for development/testing
```

### Implementation Standards

```tsx
// constants/ui.ts
export const BUTTON_VARIANTS = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  DANGER: "danger",
} as const;

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
}

// constants/mockData.ts
export const MOCK_USERS = [
  { id: "1", name: "John Doe", email: "john@example.com" },
  { id: "2", name: "Jane Smith", email: "jane@example.com" },
] as const;

export const SAMPLE_PRODUCTS = {
  electronics: [
    { id: "e1", name: "Laptop", price: 999 },
    { id: "e2", name: "Phone", price: 699 },
  ],
} as const;

// constants/index.ts - Centralized exports
export * from "./ui";
export * from "./api";
export * from "./validation";
export * from "./mockData";
```

### Constants Guidelines (STRICT)

- **No local definitions**: Never define constants in component/page files
- **Centralized location**: All constants in `/src/constants/` directory
- **Single source of truth**: Each constant defined only once
- **Proper imports**: Always import from `/constants/` directory
- **Use enums**: Prefer enums for related constant groups
- **Type assertions**: Use `as const` for immutable objects

### ❌ Violations (FORBIDDEN)

```tsx
// ❌ WRONG - Local constants
const UserList = () => {
  const MOCK_DATA = [
    // THIS IS FORBIDDEN
    { id: 1, name: "John" },
  ];

  const STATUS_OPTIONS = {
    // THIS IS FORBIDDEN
    ACTIVE: "active",
    INACTIVE: "inactive",
  };

  return <div>...</div>;
};
```

### ✅ Correct Implementation

```tsx
// ✅ CORRECT - Import from constants directory
import { MOCK_USERS, UserStatus } from "@/constants";

const UserList = () => {
  return (
    <div>
      {MOCK_USERS.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
};
```

## 🖼 Asset Management System (STRICT)

### Asset Rules

1. **No inline SVGs**: Extract all SVG code to separate files
2. **Centralized assets**: All assets in `/public/assets/`
3. **Proper imports**: Use Next.js Image component
4. **Asset exports**: Export all assets from central index file

### Asset Structure

```
/public/assets/
  /icons/
    user.svg
    settings.svg
    dashboard.svg
  /images/
    hero-banner.jpg
    product-placeholder.png
  /videos/
    intro.mp4
  index.ts          # Asset exports
```

### Asset Export System

```tsx
// public/assets/index.ts
// Icons
export { default as UserIcon } from "./icons/user.svg";
export { default as SettingsIcon } from "./icons/settings.svg";
export { default as DashboardIcon } from "./icons/dashboard.svg";

// Images
export { default as HeroBanner } from "./images/hero-banner.jpg";
export { default as ProductPlaceholder } from "./images/product-placeholder.png";
```

### Asset Usage

```tsx
// Component usage
import Image from "next/image";
import { UserIcon } from "@/public/assets";

export const UserCard = () => {
  return (
    <div className="user-card">
      <Image
        src={UserIcon}
        alt="User"
        width={24}
        height={24}
        className="user-icon"
      />
    </div>
  );
};
```

## 🧪 Testing Standards

### Testing Requirements

- **Unit tests**: For all components and utilities
- **Integration tests**: For complex component interactions
- **E2E tests**: For critical user flows
- **Test coverage**: Minimum 80% coverage requirement

### Test Structure

```tsx
// ComponentName.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { ComponentName } from "./ComponentName";

describe("ComponentName", () => {
  // Positive test cases
  it("renders correctly with required props", () => {
    render(<ComponentName title="Test" />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("handles user interactions properly", () => {
    const mockHandler = jest.fn();
    render(<ComponentName title="Test" onAction={mockHandler} />);

    fireEvent.click(screen.getByRole("button"));
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  // Negative test cases
  it("handles missing optional props gracefully", () => {
    render(<ComponentName title="Test" />);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("displays error state when data is invalid", () => {
    render(<ComponentName title="" />);
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

## 📚 Reusable Component Library

| Use Case           | Component                 | External Libraries | Location                |
| ------------------ | ------------------------- | ------------------ | ----------------------- |
| Icons              | `Icon`                    | lucide-react       | `/components/ui/Icon`   |
| Data Visualization | `Chart`                   | recharts, d3       | `/components/charts/`   |
| Form Inputs        | `Input`, `LabelInput`     | -                  | `/components/forms/`    |
| Data Display       | `LabelValue`              | -                  | `/components/ui/`       |
| Dropdowns          | `Select`, `LabelDropdown` | -                  | `/components/forms/`    |
| Buttons            | `Button`                  | -                  | `/components/ui/Button` |
| Modals             | `Modal`, `Dialog`         | -                  | `/components/ui/`       |
| Loading States     | `Spinner`, `Skeleton`     | -                  | `/components/ui/`       |
| Navigation         | `Navbar`, `Sidebar`       | -                  | `/components/layout/`   |
| Cards              | `Card`                    | -                  | `/components/ui/Card`   |

## 🔍 Development Workflow

### Before Creating New Components

1. **Check existing components** in `/src/components/`
2. **Review component library** for similar functionality
3. **Consider composition** over creating new components
4. **Plan for reusability** and extensibility

### Code Review Checklist

- [ ] TypeScript interfaces properly defined **in /types/ directory**
- [ ] All constants and mock data **in /constants/ directory**
- [ ] **No local type definitions** in components/pages
- [ ] **No local constants** in components/pages
- [ ] All colors use theme values
- [ ] No inline styles for static values
- [ ] Assets properly extracted and imported
- [ ] Tests written and passing
- [ ] Component documented with JSDoc
- [ ] Responsive design implemented
- [ ] Accessibility standards met

## 🚀 Performance Guidelines

### Optimization Standards

- **Image optimization**: Use Next.js Image component
- **Code splitting**: Implement dynamic imports for large components
- **Bundle analysis**: Regular bundle size monitoring
- **Lazy loading**: Implement for non-critical components
- **Memoization**: Use React.memo and useMemo appropriately

### Example Implementation

```tsx
import dynamic from "next/dynamic";
import { memo } from "react";

// Lazy load heavy components
const HeavyChart = dynamic(() => import("./HeavyChart"), {
  loading: () => <div>Loading chart...</div>,
});

// Memoize expensive components
export const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* Component logic */}</div>;
});
```

## 📋 Compliance Checklist

### Pre-commit Requirements

- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Tests passing (minimum 80% coverage)
- [ ] No hardcoded colors or inline styles
- [ ] Assets properly managed
- [ ] Component props properly typed
- [ ] Responsive design implemented
- [ ] Accessibility guidelines followed

### Code Quality Standards

- [ ] Consistent naming conventions
- [ ] Proper error handling
- [ ] Loading and error states implemented
- [ ] Form validation where applicable
- [ ] SEO optimization (meta tags, structured data)
- [ ] Performance optimization applied
