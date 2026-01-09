## Project under DEVELOPMENT

---

## **Overview**

**collab-platform** is a **full-stack team collaboration and productivity platform** built with  **Next.js (frontend), Go (backend), and Prisma (database)** .

It enables teams to **manage tasks, conduct real-time calls, collaborate on a shared whiteboard, and monitor productivity** — all in a single platform.

---

## **Features**

* **Dashboard**
  * View your tasks, progress stats, and upcoming calls
  * Analytics charts for productivity tracking
* **Task Management**
  * Create, edit, assign, and complete tasks
  * Organize tasks by project or priority
* **Real-Time Collaboration**
  * Voice/video calls with multiple team members
  * Shared **whiteboard** for collaborative drawing and note-taking
  * Screen sharing and tab sharing for live collaboration
* **Authentication**
  * Secure user login and registration
  * JWT-based authentication for protected routes
* **Tech Stack**
  * **Frontend:** Next.js, TypeScript, Tailwind CSS
  * **Backend:** Go (Gin / Fiber optional)
  * **Database:** Prisma ORM with PostgreSQL / MySQL / SQLite
  * **Real-Time Communication:** WebSockets for calls & whiteboard

---

## **Getting Started**

### **Prerequisites**

* Node.js >= 18
* pnpm >= 8
* Go >= 1.20
* PostgreSQL / MySQL / SQLite database

### **Installation**

<pre class="overflow-visible! px-0!" data-start="1904" data-end="2053"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span># Clone the repo</span><span>
git </span><span>clone</span><span> https://github.com/<your-username>/collab-platform.git
</span><span>cd</span><span> collab-platform

</span><span># Install dependencies</span><span>
pnpm install
</span></span></code></div></div></pre>

### **Setup Environment Variables**

Create a `.env` file in `apps/api/`:

<pre class="overflow-visible! px-0!" data-start="2130" data-end="2245"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-env"><span>DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
JWT_SECRET="your_jwt_secret"
</span></code></div></div></pre>

### **Run the Development Servers**

<pre class="overflow-visible! px-0!" data-start="2284" data-end="2348"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span># Run both frontend and backend in parallel</span><span>
pnpm dev
</span></span></code></div></div></pre>

* **Frontend:** [http://localhost:3000]()
* **Backend:** [http://localhost:4000]() (or configured port)
