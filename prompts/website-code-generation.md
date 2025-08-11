You are an expert frontend engineer. I am providing a set of folders—each representing a **screen** of a web application. Your task is to generate the **entire frontend codebase** from scratch using the contents of these folders.

---

### 📁 **Each screen folder contains:**

* A **screenshot image** (can be named anything, e.g., `login_view.png`, `screen1.jpg`, etc.) – shows the **visual layout** of the screen.
* A **raw HTML file** (can also be named differently for each screen) – represents the **DOM structure** and content of the screen.
* A `task.txt` file – describes what a **user can do** on that screen (e.g., interactions, flows, validations, state handling).
* An `assets/` folder – contains assets used in that screen such as icons, fonts, images, etc.

---

### 🗂️ **Screen Folders**

```
{screenFolders}
```

> Each of the above folders contains:
>
> * `screenshot.*` (e.g., `home_page.png`, `register_view.jpg`)
> * `html.*` (e.g., `home_raw.html`, `dashboard_ui.html`)
> * `task.txt`
> * `/assets/` (optional – used assets specific to the screen)

---

### 🎯 **Instructions**

Using the above screen folders:

1. **Understand UI layout and visual hierarchy** from the screenshot image.
2. **Extract HTML structure and content** from the raw HTML file.
3. **Read `task.txt`** to understand the user flows, behaviors, and interactivity.
4. Use files inside the `assets/` folder wherever needed in that screen (e.g., icons, SVGs, custom fonts).
5. Build a **React-based frontend codebase** with the following guidelines:

---

### 💡 **Development Guidelines**

* Use **React + TypeScript** (`.tsx` components)
* Style using **Tailwind CSS**
* Follow **mobile-first responsive design**
* Convert static HTML into **dynamic, clean JSX**
* Break out common parts into **reusable components** (e.g., `Button`, `Input`, `Navbar`, `Card`, etc.)
* Each screen’s main component should go inside `src/pages/`
* Reusable components should go inside `src/components/`
* Assume assets will be copied into `public/assets/[screen]/` during build
* Use `tailwind.config.js` for custom fonts/colors (inferred from design or assets)

---

### 📁 **Expected Output Project Structure**

```
src/
  components/
    Button.tsx
    Input.tsx
    Navbar.tsx
    ...
  pages/
    Home.tsx
    Login.tsx
    Register.tsx
    Dashboard.tsx
    Settings.tsx
    UsersList.tsx
    UserProfile.tsx
  App.tsx
  main.tsx
  tailwind.config.js
  index.css
public/
  assets/
    Home/
    Login/
    ...
```

---

### ✅ **Final Deliverable Must Include:**

* Complete working frontend project with all screens
* Reused and modular components
* Assets correctly integrated (icons/fonts)
* UI matching screenshots
* Functionality matching `task.txt` descriptions
* Comments where logic was inferred
