# UI Generation Request Template (Extended)

## Context Files

- Review `CLAUDE.md` for project patterns and semantics.
- Review `COMPONENTS.md` for available external library components.
- **Figma Screenshot**: 
```
  {screenshotFilePath}
```
- **Figma JSON Files**:  
  ```
  {layoutJSONFilePath}
  ```
- **Frontend Task File**: Path for required frontend tasks will be provided and must be reviewed before starting development.
```
    {taskFilePath}
```
- **Assets Folder**: All required assets (fonts, icons) for UI implementation are stored in the designated assets directory.
```
    {assetFolder}
```

## Custom Instructions

- {customInstruction}

## Phase 1: Analysis & Component Mapping

1. **Parse Multiple Figma JSON Files**
   - Process all JSON files from the given file paths array.
   - Extract component hierarchy and nesting from each file.
   - Identify component types (buttons, inputs, cards, containers, etc.).
   - Extract properties (text, colors, dimensions, spacing, variants).
   - Note any auto-layout, constraints, and responsive behavior.
   - Map relationships between components across different JSON files.

2. **Component Priority Check (in order)**
   - **First**: Check for local project components (`./components/`, `./src/components/`).
   - **Second**: Check external library components from `COMPONENTS.md`.
   - **Third**: Identify elements that require new custom components.

3. **Map JSON Components to React Components**
   - Match Figma component names/types to available components.
   - Consider component props based on extracted Figma properties.
   - Plan responsive behavior based on auto-layout data.
   - Handle component variants and interactive states from JSON.
   - Plan composition for complex components spanning multiple files.

4. **Verify Alignment**
   - Ensure all mapping and plans align with patterns detailed in `CLAUDE.md`.

**📋 PHASE 1 OUTPUT - PLEASE REVIEW:**

```
## Analysis Results

### Figma JSON Files Processed
- `./features/components.json` — Components Found: [list]
- `./features/layout.json` — Components Found: [list]
- `./features/cards.json` — Components Found: [list]
- `./features/forms.json` — Components Found: [list]
- **Frontend Task File**: [taskFilePath if provided]
- **Assets Folder**: [fonts, icons identified]

### Component Hierarchy (from JSON structure)
- Complete component tree across all JSON files.
- Parent → Child relationships from Figma layers.
- Cross-file component dependencies.

### Design Tokens Extracted
- Colors: [color palette from JSON]
- Typography: [font styles and sizes]
- Spacing: [padding, margins, gaps]
- Breakpoints: [responsive behavior]

### Component Mapping Table

| Figma Component | JSON File      | Type      | Properties                 | Local Match   | External Match   | Custom Needed | Selected |
|-----------------|---------------|-----------|----------------------------|---------------|------------------|---------------|----------|
| Button-Primary  | components.json| Button    | text, variant, onClick     | ✓ LocalButton | ✓ LibButton      | -             | Local    |
| Header-Nav      | layout.json    | Navigation| items, logo, actions       | -             | ✓ LibNavbar      | -             | External |
| ProductCard     | cards.json     | Card      | image, title, price, cta   | ✓ LocalCard   | -                | -             | Local    |

### Questions for Review
- Are the JSON to React component mappings correct?
- Should any component selection be changed?
- Are the extracted properties accurately interpreted?
- Does the hierarchy make sense for React implementation?
- Are cross-file component relationships handled properly?
- Are referenced tasks from the frontend task file included as needed?
- Does the assets folder cover all necessary fonts, icons for your components?
```

⏸️ **PAUSE FOR REVIEW — Please confirm before proceeding to Phase 2**

## Phase 2: Implementation Planning
*(Proceeds only after Phase 1 approval)*

1. **Create React Component Hierarchy** from approved JSON mapping.
2. **Define Props Interfaces** based on Figma properties across all JSON files.
3. **Plan Responsive Behavior** using auto-layout data in JSON.
4. **Cross-reference Screenshot** for visual layout validation and spacing.
5. **Design State Management** for interactive components from JSON and the frontend task file.
6. **Plan Styling Approach** using design tokens from JSON and assets from the assets folder.
7. **Handle Component Composition** for complex UI patterns matching the screenshot.
8. **Plan Data Flow** between parent and child components from JSON hierarchy.

**📋 PHASE 2 OUTPUT - PLEASE REVIEW:**

```
## Implementation Plan

### Component Hierarchy (from JSON structure)
MainComponent
├── Header (from layout.json)
│   ├── Logo (local component)
│   └── Navigation (external component)
├── ContentSection (from content.json)
│   ├── ProductCard (local component) × N
│   └── CallToAction (external component)
└── Footer (custom component needed)

### Props Interfaces
interface ProductCardProps {
  image: string;
  title: string;
  price: number;
  onAddToCart: () => void;
  variant?: 'default' | 'featured';
}

interface HeaderProps {
  logoSrc: string;
  navigationItems: NavItem[];
  userActions: UserAction[];
}

### Responsive Strategy
- Auto-layout → CSS Grid/Flexbox mapping.
- Breakpoint considerations from constraints.
- Mobile-first approach.
- Component-specific responsive behaviors.

### Styling Approach
- Design tokens implemented from JSON files.
- Visual styling matching screenshot and using fonts/icons from assets.
- Use of CSS/styled-components/Tailwind as appropriate.
- Responsive utilities from JSON auto-layout data.
- Consistency with screenshot appearance.

### State Management Plan
- Local component state per tasks outlined in the frontend task file.
- Parent-child data flow as per hierarchy.
- Event handling and API hooks as required.
- Incorporation of interactive requirements sourced from JSON files and specified task file.

### Questions for Review
- Does the React structure reflect the Figma design intent (JSON and screenshot)?
- Are the props interfaces comprehensive and based on all necessary sources?
- Does the layout match the target visual arrangement?
- Any concerns with planned responsive behavior?
- Is the component composition logical for the design shown?
- Are all frontend tasks from the provided task file represented?
- Are there missing state management considerations for interactive elements?
```

⏸️ **PAUSE FOR REVIEW — Please confirm before proceeding to Phase 3**

## Phase 3: Code Generation
*(Proceeds only after Phase 2 approval)*

1. **Generate React Code** using the approved plan, JSON data, screenshot, and referenced assets.
2. **Import Components** by priority (local → external → custom).
3. **Apply Styling** that matches Figma design tokens and asset folder contents.
4. **Include TypeScript Types** for component props/interfaces.
5. **Add Responsive Behavior** as per auto-layout constraints in JSON.
6. **Implement Visual Layout** per screenshot for spacing and arrangement.
7. **Implement State Management** for interactive elements, including all frontend tasks from the task file.
8. **Add Accessibility Features** (ARIA labels, keyboard navigation).
9. **Include Error Boundaries** where appropriate.
10. **Validate Against Screenshot** and asset usage for completeness.

**📋 PHASE 3 OUTPUT**

```
## Generated Code

### Main Component Implementation
[Complete React component code, referencing all assets and fulfilling all frontend tasks]

### Supporting Components (custom as needed)
[Additional custom component implementations if required]

### TypeScript Definitions
[Interface/type definitions and exports]

### Styling Implementation
[CSS, styled-components, or Tailwind classes referencing design tokens and project asset files (fonts, icons)]
```

**Please ensure:**
- The provided frontend task file is referenced during code generation and all its tasks are addressed in implementation.
- All assets (fonts, icons) from the assets folder are used appropriately for visual fidelity.