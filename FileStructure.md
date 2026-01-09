What the 
my-collab-platform/          # Root of Turborepo
├─ apps/
│   ├─ web/                  # Next.js frontend
│   │   ├─ app/
│   │   │   ├─ dashboard/
│   │   │   │   ├─ page.tsx
│   │   │   │   ├─ components/
│   │   │   │   │   ├─ TaskList.tsx
│   │   │   │   │   ├─ TaskCard.tsx
│   │   │   │   │   └─ AnalyticsChart.tsx
│   │   │   ├─ call/
│   │   │   │   ├─ page.tsx
│   │   │   │   ├─ components/
│   │   │   │   │   ├─ VideoGrid.tsx
│   │   │   │   │   ├─ ChatBox.tsx
│   │   │   │   │   └─ WhiteboardCanvas.tsx
│   │   │   ├─ auth/
│   │   │   │   ├─ login.tsx
│   │   │   │   └─ register.tsx
│   │   │   └─ layout.tsx
│   │   ├─ components/       
│   │   │   ├─ Navbar.tsx
│   │   │   └─ Sidebar.tsx
│   │   ├─ lib/
│   │   │   ├─ api.ts        
│   │   │   └─ auth.ts       
│   │   ├─ styles/
│   │   │   └─ globals.css
│   │   ├─ package.json
│   │   └─ tsconfig.json
│   │
│   └─ mobile/ (optional)   
│
├─ apps/
│   └─ api/                  # Go backend
│       ├─ main.go
│       ├─ go.mod
│       ├─ prisma/           # Prisma folder
│       │   ├─ schema.prisma
│       │   ├─ migrations/   # Automatically created by Prisma migrate
│       │   └─ seed.ts       # Optional seeding script
│       ├─ config/
│       │   └─ config.go     # DB, JWT, env configs
│       ├─ models/           # Optional Go structs if needed
│       │   ├─ user.go
│       │   ├─ task.go
│       │   └─ call.go
│       ├─ controllers/
│       │   ├─ auth_controller.go
│       │   ├─ task_controller.go
│       │   ├─ call_controller.go
│       │   └─ whiteboard_controller.go
│       ├─ routes/
│       │   └─ routes.go
│       ├─ middleware/
│       │   └─ auth.go
│       ├─ utils/
│       │   ├─ hash.go
│       │   └─ response.go
│       └─ websocket/
│           ├─ whiteboard.go
│           ├─ chat.go
│           └─ signaling.go
│
├─ packages/                 
│   ├─ types/                
│   │   ├─ task.ts
│   │   ├─ user.ts
│   │   └─ call.ts
│   ├─ ui/                   
│   │   └─ Button.tsx
│   └─ utils/                
│       └─ formatDate.ts
│
├─ package.json               
├─ turbo.json                 
├─ tsconfig.base.json         
└─ .gitignore