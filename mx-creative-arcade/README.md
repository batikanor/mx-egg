# MX Creative Arcade

A collection of web-based games and demos designed for the **Logitech MX Creative Console** (Keypad), built with WebHID.

This project turns your MX Creative Console into a mini arcade controller, complete with LCD visual feedback and custom input handling.

## 🎮 Games Included

*   **Hub:** Main menu to browse and launch games.
*   **Tic Tac Toe:** Classic local multiplayer.
*   **Bomb Finder:** Minesweeper-style logic game.
*   **MX Pong:** Arcade tennis.
*   **Neon Racer:** High-speed dodging game.
*   **MX Dance:** Rhythm game.
*   **Whack-a-Sprite:** Reaction speed test.
*   **Memory Matrix:** Pair matching game.
*   **Keypad Rogue:** Mini dungeon crawler.
*   **Precision Timer:** Timing challenge.
*   **MX DOOM:** Raycasting 3D shooter demo.
*   **MX Simon:** Pattern memory game.

## 🚀 Features

*   **WebHID Integration:** Direct communication with the device (no drivers needed).
*   **Virtual Console:** A toggleable on-screen virtual keypad allows you to play and test all games even without the physical hardware.
*   **Plug & Play:** Just connect and play in Chrome or Edge.

## 🏃 How to Run

This project uses ES modules, so you must run it via a local web server. You cannot simply open the HTML files directly.

### Option 1: Python (Recommended)

If you have Python installed:

```bash
python3 -m http.server 8000
```

### Option 2: Node.js

If you have Node.js installed:

```bash
npx serve .
```

### Open in Browser

1.  Open a Chromium-based browser (Chrome, Edge, etc.).
2.  Navigate to:
    **[http://localhost:8000/mx-creative-arcade/hub.html](http://localhost:8000/mx-creative-arcade/hub.html)**

## 🕹️ Controls

*   **Physical Device:** Connect your MX Creative Console Keypad.
*   **Virtual Console:** Click "Show Console View" in the bottom right corner to open the virtual keypad. You can click the virtual buttons with your mouse or touch.

## 🛠️ Project Structure

*   `mx-creative-arcade/`: Contains all game HTML files and assets.
    *   `hub.html`: The main entry point.
    *   `games/`: Individual game files (Tic Tac Toe, Doom, etc.).
    *   `packages/`:
        *   `mx-creative-console.js`: WebHID library.
        *   `virtual-console.js`: Virtual keypad implementation.
