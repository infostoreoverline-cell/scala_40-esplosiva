# Scala 40 Esplosiva 🃏

Webapp per il conteggio dei punti di **Scala 40**, con storico vittorie, gestione giocatori e musica YouTube.

## 🚀 Deploy

Questa app è deployata su **Vercel** come sito statico (HTML + CSS + JS).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/infostoreoverline-cell/scala_40-esplosiva)

## ✨ Funzionalità

- 🎮 **Nuova Partita** – Seleziona i giocatori e inizia subito
- 📝 **Conteggio mani** – Inserisci i punti per ogni mano, il totale è automatico
- 💥 **Eliminazione** – Chi supera 100 punti (configurabile) viene eliminato
- 🏆 **Storico vittorie** – Tabellone con win rate e medie
- 👥 **Gestione giocatori** – Salva i tuoi giocatori abituali
- 🎵 **Playlist YouTube** – Link rapidi alle tue playlist preferite
- ↩ **Undo** – Annulla l'ultima mano inserita
- 🧮 **Calcolatore** – Calcola i punti dalle carte in mano
- 🎊 **Confetti** – Celebrazione animata per il vincitore!

## 📦 Struttura

```
├── index.html      # App (single-page)
├── style.css       # Dark theme premium
├── app.js          # Logica completa
├── vercel.json     # Config deploy
└── README.md
```

## 💾 Dati

Tutti i dati sono salvati nel **localStorage** del browser. Nessun backend richiesto.

## 🎮 Regole Scala 40

- Chi chiude (va a segno) prende **0 punti**
- Le **figure** (J, Q, K) valgono **10 punti**
- L'**asso** vale **11 punti** (configurabile a 1)
- Le **altre carte** valgono il proprio valore numerico
- Chi supera il **punteggio limite** (default 100) viene eliminato
- Vince chi ha **meno punti** quando tutti gli altri vengono eliminati

## 🛠 Sviluppo locale

Apri semplicemente `index.html` nel browser (o usa Live Server in VS Code).

---

Made with ❤️ and 🃏 | Scala 40 Esplosiva
