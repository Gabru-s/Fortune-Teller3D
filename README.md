
# 🎱 8-Ball Fortune

A fun, interactive web-based fortune-telling experience where users can tap on a magic 8-ball to receive randomized fortunes. This project leverages WebGL shaders and procedural noise functions to generate dynamic visual effects.

---

## 📂 Project Structure

```
8-ball-fortune/
├── css/
│   └── main.css               # Styles for the project
├── js/
│   └── main.js                # Main JavaScript module handling interactions and rendering
├── star.png                   # Favicon image
├── index.html                 # Main HTML file
└── README.md                  # Project documentation
```

---

## 🚀 How to Run

### ⚠️ Important: Requires a Local Live Server

Because this project uses **JavaScript ES Modules** (via `type="module"` in `<script>`), it **cannot be opened directly via `file://` protocol** in a browser.  
Modern browsers block this for security reasons.

### ✅ Run it with a local live server using one of the options below:

### Option 1: VS Code Live Server Extension  
- Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
- Open the project folder in VS Code
- Right-click `index.html` and select **Open with Live Server**

### Option 2: Python HTTP Server  

If you have Python installed:

```bash
# For Python 3.x
python -m http.server
```

Then open:
```
http://localhost:8000
```

### Option 3: Node.js `serve` package  

If you have Node.js installed:

```bash
npx serve .
```

Then open the provided local URL (usually `http://localhost:5000`)

---

## 🖥️ Technologies Used

- **HTML5**
- **CSS3**
- **JavaScript (ES Modules)**
- **WebGL / GLSL Shaders**

### Shader Techniques:
- **Fractal Brownian Motion (FBM)**
- **4D Simplex Noise**

---

## 📦 Features

- Interactive 8-ball with dynamic visuals
- Smooth procedural noise animations
- Optimized for both desktop and mobile browsers
- Simple, no-framework HTML/CSS/JS structure

---

## 📌 Future Improvements

- Add fortune text responses upon ball tap
- Include sound effects
- Transition effects between fortunes
- Mobile touch gesture improvements

---

## 📄 License

This project is open-source and free to use under the [MIT License](https://opensource.org/licenses/MIT).
