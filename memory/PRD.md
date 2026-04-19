# PRD - Periodizzazione Tattica - Accademia Allenatori

## Problem Statement
Piattaforma web interattiva per un corso di formazione allenatori sulla Periodizzazione Tattica e Calcio Relazionale.

## Architecture
- **Backend**: FastAPI (Python) + MongoDB (Motor async driver)
- **Frontend**: React 19 + Tailwind CSS
- **AI**: OpenAI GPT-4o via emergentintegrations (Emergent LLM Key)
- **Auth**: JWT Bearer tokens, role-based (admin/student)
- **Payments**: PayPal (latuafrica@gmail.com) - 49 EUR one-time
- **PDF**: fpdf2 for certificate generation

## What's Been Implemented

### Iteration 1 (15 Apr 2026)
- [x] Full backend + frontend with auth, 7 original modules, 18 lessons
- [x] AI chat, exercises with SVG diagrams, progress tracking

### Iteration 2 (16 Apr 2026)
- [x] Freemium model, PayPal payment, PDF certificate
- [x] Admin panel with payment management

### Iteration 3 (19 Apr 2026)
- [x] Code quality fixes (refactored ai_chat, certificate, imports)
- [x] **NEW MODULE: "Tutta PT a Modo mio"** - imported from user's .docx document
- [x] 10 lessons with 112,000+ chars of authentic instructor content
- [x] Premium section (paid) with first lesson free

## Current Content
- 8 modules total (7 original + 1 "Tutta PT a Modo mio")
- 28 lessons total (18 original + 10 from document)
- 5 practical exercises with SVG tactical diagrams

## Backlog
### P1
- Editor WYSIWYG per admin
- Quiz interattivi fine modulo
### P2
- Community/forum
- PWA mobile
- Gamification
