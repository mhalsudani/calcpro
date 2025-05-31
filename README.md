# CalcPro - Advanced File Manager

CalcPro is an intelligent file management platform disguised as a calculator, featuring advanced security, cloud storage, and bilingual support.

## Key Features

- **Security**: 4-digit PIN authentication with security question recovery
- **Storage**: Free (50MB local) and Premium (unlimited cloud) versions  
- **Interface**: Mobile-first design with Arabic/English support
- **Files**: Auto-organization (📸 Images, 🎥 Videos, 📄 Documents)
- **Offline**: Works without internet, syncs when connected

## Usage

1. Open the calculator interface
2. Enter PIN: `1234` (premium) or `7360` (free)
3. Press "=" to access files
4. Create custom PIN with security questions

## Technology

- React 18 + TypeScript
- Node.js + Express + PostgreSQL
- Stripe payments + Drizzle ORM
- Tailwind CSS + Radix UI

## Setup

```bash
npm install
cp .env.example .env
npm run db:push
npm run dev
