# PRD - Periodizzazione Tattica - Accademia Allenatori

## Problem Statement
Piattaforma web interattiva per un corso di formazione allenatori sulla Periodizzazione Tattica e Calcio Relazionale. L'istruttore vuole creare lezioni che riflettano una filosofia profonda e olistica del calcio.

## Architecture
- **Backend**: FastAPI (Python) + MongoDB (Motor async driver)
- **Frontend**: React 19 + Tailwind CSS + Radix UI
- **AI**: OpenAI GPT-4o via emergentintegrations library (Emergent LLM Key)
- **Auth**: JWT Bearer tokens, role-based (admin/student)
- **Payments**: PayPal (latuafrica@gmail.com) - 49 EUR one-time payment
- **PDF**: fpdf2 for certificate generation
- **Design**: Tema nero (#050505) con accenti oro (#D4AF37), font Cormorant Garamond + Outfit

## User Personas
1. **Istruttore (Admin)**: Crea e gestisce contenuti, visualizza statistiche, monitora allievi e pagamenti
2. **Allievi (Students)**: Seguono i moduli, completano lezioni, usano AI assistant, pagano per contenuti premium

## Core Requirements
- Autenticazione JWT con ruoli admin/student
- 7 moduli di lezione con contenuti filosofici sulla PT
- Sistema di progressione per ogni allievo
- Esercitazioni pratiche con diagrammi tattici SVG
- Assistente AI per domande sulla metodologia
- Generatore AI di esercitazioni personalizzate
- Pannello admin per gestione contenuti, allievi e pagamenti
- Supporto video YouTube/Vimeo + upload diretto
- **Modello freemium: prima lezione gratuita, resto a pagamento**
- **Pagamento PayPal 49 EUR one-time**
- **Certificato PDF scaricabile al completamento**

## What's Been Implemented

### Iteration 1 (15 Apr 2026)
- [x] Backend completo: Auth, Modules, Lessons, Exercises, Progress, AI Chat, Admin APIs
- [x] Seed data: 7 moduli, 18 lezioni, 5 esercitazioni con contenuti in italiano
- [x] Frontend: Landing page, Auth, Dashboard, Module/Lesson viewer, Exercises, AI Chat, Admin
- [x] Design nero/oro con font Cormorant Garamond e Outfit
- [x] Diagrammi tattici SVG interattivi
- [x] Fix CORS: migrazione da cookie a Bearer token (localStorage)

### Iteration 2 (16 Apr 2026)
- [x] Modello freemium: prima lezione di ogni modulo gratuita
- [x] Paywall: lezioni premium bloccate con lucchetto
- [x] Pagina pagamento PayPal (49 EUR) con bottone e conferma
- [x] Certificato PDF di completamento scaricabile
- [x] Admin: gestione pagamenti, stato pagamento per ogni allievo
- [x] Testing: 98% overall (Backend 100%, Frontend 95%)

## 7 Moduli del Corso (basati sulle risposte dell'istruttore)
1. Le Connessioni - Sistemi complessi e liberta di pensiero
2. La Metodologia PT - Il Tutto come sistema frattale
3. L'Armonia Musicale - L'errore come connessione
4. Il Caos Organizzato - Le esercitazioni come opera d'arte
5. L'Architetto e il Giardiniere - Il linguaggio adattivo
6. I Principi Trasformabili - L'adattamento al contesto
7. La Metamorfosi dell'Allenatore - Trasformazione come stile di vita

## Prioritized Backlog
### P0 (Done)
- Full auth system, 7 course modules, student progression, AI assistant, PayPal payment, PDF certificate

### P1 (Next)
- Editor WYSIWYG per l'istruttore
- Quiz interattivi di fine modulo
- Gestione manuale pagamenti admin (attiva/revoca accesso)

### P2 (Future)
- Community/forum tra allievi
- Statistiche avanzate sull'engagement
- PWA per mobile
- Gamification con badge
- Integrazione PayPal API completa (non solo link)

## Next Tasks
1. Editor contenuti per admin
2. Quiz interattivi di fine modulo
3. Sistema di notifiche email per nuovi contenuti
