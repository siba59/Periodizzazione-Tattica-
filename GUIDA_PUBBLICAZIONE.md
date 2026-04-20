# GUIDA COMPLETA: Come Pubblicare il Sito

## PASSO 1 — Salva il codice su GitHub
1. In basso nella chat di Emergent, clicca l'icona **GitHub** ("Save to GitHub")
2. Scegli un nome per il repository (es: `periodizzazione-tattica`)
3. Attendi che il codice venga caricato

---

## PASSO 2 — Backend su Render.com (GRATIS)

### 2.1 Crea account
- Vai su **https://render.com** e registrati (gratis con GitHub)

### 2.2 Crea il database MongoDB
- Vai su https://www.mongodb.com/atlas e crea un cluster gratuito
- Crea un utente database e ottieni la **connection string** (tipo: `mongodb+srv://user:pass@cluster.mongodb.net/ptacademy`)

### 2.3 Crea il Web Service
1. Clicca **"New" → "Web Service"**
2. Connetti il tuo repository GitHub
3. Configura:
   - **Name**: `periodizzazione-tattica-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
4. Aggiungi le **Environment Variables**:
   - `MONGO_URL` = la tua connection string di MongoDB Atlas
   - `DB_NAME` = `ptacademy`
   - `JWT_SECRET` = una stringa lunga e casuale (es: `a7f3c9e2d1b4f5e8a0c3d6f9b2e5h8k1`)
   - `ADMIN_EMAIL` = `admin@periodizzazione.it`
   - `ADMIN_PASSWORD` = `TatticaPT2024!`
   - `PAYPAL_EMAIL` = `latuafrica@gmail.com`
   - `EMERGENT_LLM_KEY` = (la chiave AI che hai usato nel corso)
5. Clicca **"Create Web Service"**
6. Attendi 5-10 minuti — avrai un URL tipo: `https://periodizzazione-tattica-api.onrender.com`

---

## PASSO 3 — Frontend su Netlify (GRATIS)

### 3.1 Crea account
- Vai su **https://app.netlify.com** e registrati (gratis con GitHub)

### 3.2 Importa il progetto
1. Clicca **"Add new site" → "Import an existing project"**
2. Scegli **GitHub** e seleziona il tuo repository
3. Configura:
   - **Base directory**: `frontend`
   - **Build command**: `yarn build`
   - **Publish directory**: `frontend/build`
4. Aggiungi la **Environment Variable**:
   - `REACT_APP_BACKEND_URL` = l'URL del tuo backend Render (es: `https://periodizzazione-tattica-api.onrender.com`)
5. Clicca **"Deploy site"**

### 3.3 Aggiorna netlify.toml
Nel file `netlify.toml` nella root del progetto, sostituisci `TUO-BACKEND-SU-RENDER.onrender.com` con il tuo URL Render reale.

---

## PASSO 4 — Pubblica su Google

1. Vai su **https://search.google.com/search-console**
2. Aggiungi il tuo dominio Netlify (es: `tuo-sito.netlify.app`)
3. Verifica la proprietà seguendo le istruzioni
4. Google indicizzerà il sito automaticamente in 1-2 settimane

### Dominio personalizzato (opzionale)
- Compra un dominio su **Namecheap** o **GoDaddy** (es: `periodizzazionetattica.it`)
- Configuralo sia su Netlify che su Render

---

## RIEPILOGO COSTI
| Servizio | Costo |
|----------|-------|
| Netlify (frontend) | GRATIS |
| Render (backend) | GRATIS (tier free) |
| MongoDB Atlas | GRATIS (512MB) |
| Dominio .it (opzionale) | ~10 EUR/anno |

---

## AIUTO
Se hai problemi, contattami o scrivi a support@emergent.sh
