
# Engineering & Development Guidelines

## Technical Stack
- **Frontend**: React + Tailwind CSS
- **Routing**: React Router (HashRouter for compatibility)
- **State/Persistence**: Hybrid `localStorage` + Supabase (Dual-mode)
- **AI**: Google Gemini API via `@google/genai`
- **Icons**: Lucide React

## Data Architecture
The application uses a **Simulation-First** pattern. If Supabase keys are missing, the system automatically falls back to a robust `localStorage` mock store.
- **Store**: Centralized in `store.ts`. All persistence logic must go here.
- **URNs**: Uniform Resource Names follow the `urn:wasomi:research:[id]` pattern. They are immutable once generated.

## Notification System
Notifications are triggered via `createNotification(userId, ...)` or `notifyRole(role, ...)`.
- **Triggers**: Must be explicitly called during state transitions (e.g., in `ResearchDetail.tsx`).
- **Polling**: Handled in `DashboardLayout.tsx` via a 5-second interval.

## Security & Guards
1. **Auth Guards**: Components must check `user.verified` and `user.isSuspended`.
2. **Role Guards**: View-level checks must prevent Students from accessing Supervisor/Publisher/Admin tools.
3. **Draft Privacy**: Research in `DRAFT` status must never appear in public search results.

## AI Integration
We use Gemini to generate "Impact Briefs". 
- **Model**: `gemini-3-flash-preview` for high-speed analysis.
- **Prompting**: Structured JSON responses are mandatory to maintain metadata integrity.

---
*Maintain the URN immutability at all costs.*
