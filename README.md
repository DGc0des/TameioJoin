# Ταμείο — Cash Register Reconciliation App

A lightweight web app for closing the cash register and reconciling the till at the
end of a shift. Staff count bills and coins, log expenses and card/delivery income,
and the app handles all the calculations, produces a cash-drop ("Φάκελος") breakdown,
and shares a clean end-of-day summary as an image.

Built for and in active daily use at Join Juice Bars, Thessaloniki.

## Background

I came up with the idea for this app and built it from scratch.

While working as a barista and shift manager at Join Juice Bars, I noticed how slow
and error-prone our daily cash register reconciliation and end-of-day money counting
had become. So I designed and developed this custom web application to streamline the
whole closing procedure — guiding staff step by step, automating the math, and cutting
down both the time and the mistakes involved in balancing the till.

The project was entirely self-motivated: I identified a real business problem, proposed
a technical solution, built it, deployed it for the whole team, and kept iterating on it
based on their feedback. It is currently in active use at the store.


## Features

- **Bill & coin counting** — enter every denomination (100€ → 0.05€) and get a running total.
- **Two input modes** — type a raw **€ amount** per denomination, or switch to **# pieces**
  mode to enter quantities and let the app multiply them out.
- **Expenses (Έξοδα)** — log a variable number of expenses (1–10), each with a description
  and amount, summed automatically.
- **Other income sources** — dedicated fields for delivery platforms (WOLT, EFOOD) and
  card terminals (myPos, Eurobank), plus loose change (ΚΕΡΜΑΤΑ).
- **Live summary** — automatic totals for the till, total expenses, cash, and the
  reconciled cash/income figures.
- **Φάκελος (Envelope)** — generates the cash-drop breakdown for the deposit envelope.
- **Στέλνω (Send/Share)** — renders the full end-of-day summary into a single compact
  image (so it fits even with many expenses) and shares it via the device's native share
  sheet. An optional receipt photo can be attached.
- **Name & date** — pick the staff member and the date (with a built-in calendar picker).
- **Dark mode** — toggle between light and dark themes.
- **Mobile-first** — designed for quick use on a phone at the register.

## Tech Stack

- **HTML / CSS / Vanilla JavaScript** — no framework, no build step.
- **[html2canvas](https://html2canvas.hertzen.com/)** — renders the summary to an image
  for sharing.
- **Web Share API** — native sharing of the generated image and attached receipt.



## Project Structure

```
index.html   — markup and layout
styles.css   — styling, theming, dark mode
script.js    — all logic: calculations, input modes, expenses, sharing
```

## Author

**Dimitrios Gkrezios** — idea, design, and implementation.
