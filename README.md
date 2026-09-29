# Household Appliances Site

This project is a server-rendered web application built with **Node.js**, **Express** and **EJS**, developed as a university project for the Web Programming (PW) course, featuring user authentication and a shopping list backed by a SQLite database.

## Features

- **User accounts** – registration and login with hashed passwords (`bcrypt`) and session-based authentication
- **Shopping list** – items are stored in a local SQLite database (`cumparaturi.db`)
- **Quiz** – multiple-choice questions loaded from `intrebari.json` (topics: microwave, washing machine, fridge, oven usage and cleaning)
- **Input validation** – form data is validated with `express-validator`
- **Rate limiting** – `express-rate-limit` protects against repeated or abusive requests
- **Server-side templates** – EJS views with a shared layout (`express-ejs-layouts`)

### Installing and running the app

```bash
git clone https://github.com/MaryAdry6/SiteNODEJS.git
cd SiteNODEJS
npm install
node app.js
```

Then open the address printed in the console in your browser (for example `http://localhost:3000` — check `app.js` for the exact port).