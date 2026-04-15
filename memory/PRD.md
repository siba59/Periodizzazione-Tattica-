# PRD - Periodizzazione Tattica - Accademia Allenatori

## Problem Statement
Piattaforma web interattiva per un corso di formazione allenatori sulla Periodizzazione Tattica e Calcio Relazionale. L'istruttore vuole creare lezioni che riflettano una filosofia profonda e olistica del calcio, dove i principi tattici si intrecciano con la vita, l'arte, la musica e la filosofia.

## Architecture
- **Backend**: FastAPI (Python) + MongoDB (Motor async driver)
- **Frontend**: React 19 + Tailwind CSS + Radix UI
- **AI**: OpenAI GPT-4o via emergentintegrations library (Emergent LLM Key)
- **Auth**: JWT with httpOnly cookies, role-based (admin/student)
- **Design**: Tema nero (#050505) con accenti oro (#D4AF37), font Cormorant Garamond + Outfit

## User Personas
1. **Istruttore (Admin)**: Crea e gestisce contenuti, visualizza statistiche, monitora allievi
2. **Allievi (Students)**: Seguono i moduli, completano lezioni, usano AI assistant, visualizzano esercitazioni

## Core Requirements
- Autenticazione JWT con ruoli admin/student
- 7 moduli di lezione con contenuti filosofici sulla PT
- Sistema di progressione per ogni allievo
- Esercitazioni pratiche con diagrammi tattici SVG
- Assistente AI per domande sulla metodologia
- Generatore AI di esercitazioni personalizzate
- Pannello admin per gestione contenuti e allievi
- Supporto video YouTube/Vimeo + upload diretto

## What's Been Implemented (15 Jan 2026)
- [x] Backend completo: Auth, Modules, Lessons, Exercises, Progress, AI Chat, Admin APIs
- [x] Seed data: 7 moduli, 18 lezioni, 5 esercitazioni con contenuti in italiano
- [x] Frontend: Landing page, Auth, Dashboard, Module/Lesson viewer, Exercises, AI Chat, Admin
- [x] Design nero/oro con font Cormorant Garamond e Outfit
- [x] Diagrammi tattici SVG interattivi
- [x] Rendering Markdown per contenuti lezione
- [x] Sistema di progressione con barra visuale
- [x] AI Chat con emergentintegrations (GPT-4o)
- [x] AI Exercise Generator
- [x] Video embed (YouTube/Vimeo) + upload diretto
- [x] Testing: 95% overall (Backend 84.2%, Frontend 100%)

## Prioritized Backlog
### P0 (Done)
- Full auth system with JWT
- 7 course modules with philosophical content
- Student progression tracking
- AI assistant integration

### P1 (Next)
- Editor WYSIWYG per l'istruttore (modifica lezioni dal pannello admin)
- Sistema di notifiche per nuovi contenuti
- Ricerca full-text nei contenuti delle lezioni
- Quiz interattivi alla fine di ogni modulo

### P2 (Future)
- Community/forum per discussioni tra allievi
- Certificato di completamento scaricabile
- Statistiche avanzate sull'engagement
- App mobile (PWA)
- Sistema di gamification con badge

## Next Tasks
1. Editor contenuti per admin (WYSIWYG)
2. Quiz interattivi di fine modulo
3. Sistema di notifiche
4. Ricerca nei contenuti
