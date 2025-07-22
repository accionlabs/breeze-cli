# UI Generation Request Template (Extended – HTML Files Version)

## Context Files

- Review `CLAUDE.md` for project patterns and semantics.
- Review `COMPONENTS.md` for available external library components (optional).
- **Screenshot**: 
```
  {screenshotFilePath}
```
- **HTML Files**:  
  ```
  {htmlFilePath}
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

1. **Parse Multiple HTML Files**
   - Process all HTML files from the given file paths array.
   - Extract component hierarchy and nesting from each HTML structure.
   - Identify component types (buttons, inputs, cards, containers, etc.).
   - Extract properties (text, colors, dimensions, spacing, variants, classes, ids).
   - Note any layout wrappers, responsive utility classes, and constraints.
   - Map relationships and repeated patterns between components across different HTML files.

2. **Component Priority Check (in order)**
   - **First**: Check for local project components (`./components/`, `./src/components/`).
   - **Second**: Check external library components from `COMPONENTS.md`.
   - **Third**: Identify elements that require new custom components.

3. **Map HTML DOM Elements to React Components**
   - Match named and classed elements in HTML to available components.
   - Consider component props based on extracted HTML attributes, content, and class names.
   - Plan responsive behavior based on classes/attributes found.
   - Handle component states and variants from data/state-reflective HTML.
   - Plan composition for complex components spanning multiple files.

4. **Verify Alignment**
   - Ensure all mapping and plans align with patterns detailed in `CLAUDE.md`.


**📋 PHASE 1 OUTPUT - PLEASE REVIEW:**
```
## Analysis Results

### HTML Files Processed
- `./features/components.html` — Components Found: [list]
- `./features/layout.html` — Components Found: [list]
- `./features/cards.html` — Components Found: [list]
- `./features/forms.html` — Components Found: [list]
- **Frontend Task File**: [taskFilePath if provided]
- **Assets Folder**: [fonts, icons identified]

### Component Hierarchy (from HTML structure)
- Complete component tree across all HTML files.
- Parent → Child relationships from HTML DOM.
- Cross-file component dependencies.

### Design Tokens Extracted
- Colors: [color palette from CSS/classes]
- Typography: [font families, classes, sizes]
- Spacing: [padding, margins, utility classes]
- Breakpoints: [responsive class names/behavior]

### Component Mapping Table

| HTML Element/Class  | HTML File         | Type     | Properties                  | Local Match   | External Match   | Custom Needed | Selected |
|---------------------|------------------|----------|-----------------------------|---------------|------------------|---------------|----------|
| .btn-primary        | components.html   | Button   | text, class, onClick        | ✓ LocalButton | ✓ LibButton      | -             | Local    |
| .nav-header         | layout.html       | Navigation| items, logo, actions        | -             | ✓ LibNavbar      | -             | External |
| .product-card       | cards.html        | Card     | image, title, price, button | ✓ LocalCard   | -                | -             | Local    |


### Questions for Review
- Are the HTML to React component mappings correct?
- Should any component selection be changed?
- Are the extracted properties accurately interpreted from HTML/CSS?
- Does the hierarchy make sense for React implementation?
- Are cross-file component relationships handled properly?
- Are referenced tasks from the frontend task file included as needed?
- Does the assets folder cover all necessary fonts, icons for your components?
```

⏸️ **PAUSE FOR REVIEW — Please confirm before proceeding to Phase 2**

## Phase 2: Implementation Planning
*(Proceeds only after Phase 1 approval)*

1. **Create React Component Hierarchy** from approved HTML mapping.
2. **Define Props Interfaces** based on HTML element attributes and class information.
3. **Plan Responsive Behavior** using class names and layout patterns in HTML.
4. **Cross-reference Screenshot** for visual layout validation and spacing.
5. **Design State Management** for interactive elements referenced in HTML and the frontend task file.
6. **Plan Styling Approach** using colors, typography, and assets from the assets folder and HTML/CSS.
7. **Handle Component Composition** for complex UI patterns matching the screenshot.
8. **Plan Data Flow** between parent and child components from HTML hierarchy.

**📋 PHASE 2 OUTPUT - PLEASE REVIEW:**
```
## Implementation Plan

### Component Hierarchy (from HTML structure)
MainComponent
├── Header (from layout.html)
│   ├── Logo (local component)
│   └── Navigation (external component)
├── ContentSection (from content.html)
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
- Utility/responsive classes → CSS Grid/Flexbox/utility mapping.
- Breakpoint considerations from HTML/CSS.
- Mobile-first approach.
- Component-specific responsive behaviors.

### Styling Approach
- Design tokens and class names from HTML/CSS.
- Visual styling matching screenshot and using fonts/icons from assets.
- Use of CSS/styled-components/Tailwind as appropriate.
- Responsive utilities derived from HTML classes.
- Consistency with screenshot appearance.

### State Management Plan
- Local component state per tasks outlined in the frontend task file.
- Parent-child data flow as per hierarchy.
- Event handling and API hooks as required.
- Incorporation of interactive requirements from HTML and specified task file.

### Questions for Review
- Does the React structure reflect the HTML+Screenshot intent?
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

1. **Generate React Code** using the approved plan, HTML data, screenshot, and referenced assets.
2. **Import Components** by priority (local → external → custom).
3. **Apply Styling** matching design tokens, HTML classes, and asset folder contents.
4. **Include TypeScript Types** for component props/interfaces.
5. **Add Responsive Behavior** as per .html/CSS constraints and classes.
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