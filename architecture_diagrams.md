# Collab Platform — Architecture Diagrams

---

## 1. Frontend Architecture — Dashboard & Whiteboard

```mermaid
graph TB
    subgraph "Frontend Apps"
        subgraph "web - Next.js App"
            LP["Landing Page<br/>/"]
            LG["Login Page<br/>/login"]
            SG["Signup Page<br/>/signup"]
            OA["OAuth Callback<br/>/auth/callback"]
            DB["Dashboard<br/>/dashboard"]
            ST["Settings<br/>/settings"]
            PR["Pricing / Privacy / Terms"]
        end

        subgraph "colab-whiteboard-web - Vite + React"
            WB_LP["Landing Page<br/>/"]
            WB_LG["Login<br/>/login"]
            WB_SG["Signup<br/>/signup"]
            WB_OA["OAuth Callback"]
            WB_PV["Private Whiteboard<br/>/private-board"]
            WB_WB["Basic Whiteboard<br/>/whiteboard"]
            WB_CL["Collab Whiteboard<br/>/collab/:roomId"]
            WB_PR["ProtectedRoute"]
            WB_TL["WhiteboardTemplates"]
            WB_IV["InviteMemberModal"]
        end

        subgraph "colab-word-web - Vite + React"
            WD_LP["Landing Page<br/>/"]
            WD_DB["Dashboard"]
            WD_CL["CollabDocument<br/>/document/:roomId"]
            WD_ED["DocumentEditor<br/>(Yjs + TipTap)"]
        end
    end

    subgraph "Shared Packages"
        AUTH["@repo/auth<br/>AuthProvider + useAuth"]
        PREF["Preferences<br/>Theme + Accent"]
    end

    DB -->|"Opens in new tab"| WB_CL
    DB -->|"Opens in new tab"| WD_CL
    DB -->|"REST API calls"| API_EXT["Go API :4000"]
    WB_CL -->|"WebSocket /ws/collab/:roomId"| WS_EXT["WebSocket Server"]
    WD_CL -->|"WebSocket /ws/document/:roomId"| WS_EXT
    AUTH --> DB
    AUTH --> WB_CL
    AUTH --> WD_CL

    style DB fill:#6366f1,stroke:#4f46e5,color:#fff
    style WB_CL fill:#ec4899,stroke:#db2777,color:#fff
    style WD_CL fill:#14b8a6,stroke:#0d9488,color:#fff
    style AUTH fill:#f59e0b,stroke:#d97706,color:#fff
```

---

## 2. Backend Architecture (Go API)

```mermaid
graph TB
    subgraph "cmd/"
        MAIN["main.go<br/>Graceful Shutdown<br/>WaitGroup + Channels + Select"]
    end

    subgraph "internal/api/"
        APP["app.go<br/>Chi Router + CORS<br/>Middleware Stack"]
        DBC["db.go<br/>GORM + PostgreSQL<br/>Connection Pool"]

        subgraph "routes/"
            R_AUTH["auth.route.go"]
            R_WB["whiteboard.route.go"]
            R_CWB["collab_whiteboard.route.go"]
            R_DOC["document.route.go"]
        end

        subgraph "controllers/"
            C_AUTH["auth.controller.go<br/>Login / Signup / Refresh / Logout"]
            C_OAUTH["oauth.controller.go<br/>Google / GitHub OAuth"]
            C_WB["whiteboard.controller.go<br/>Private Board CRUD"]
            C_CWB["collab_whiteboard.controller.go<br/>Collab CRUD + Members"]
            C_DOC["document.controller.go<br/>Document CRUD + Members"]
        end

        subgraph "middlewares/"
            M_AUTH["auth.middleware.go<br/>JWT Validation"]
            M_CSRF["csrf.middleware.go<br/>CSRF Token Store"]
            M_RL["ratelimit.middleware.go<br/>Token Bucket Algorithm"]
        end

        subgraph "models/"
            MO_USER["User"]
            MO_OAUTH["OAuthProvider"]
            MO_RT["RefreshToken"]
            MO_WB["WhiteboardData"]
            MO_CWB["CollabWhiteboard"]
            MO_WBM["WhiteboardMember"]
            MO_DOC["DocumentData"]
            MO_CDOC["CollabDocument"]
            MO_DM["DocumentMember"]
        end

        subgraph "utils/"
            U_JWT["jwt.util.go<br/>Generate + Validate JWT"]
            U_PWD["password.util.go<br/>bcrypt Hash + Compare"]
        end
    end

    subgraph "websocket/"
        WS["ws.go<br/>RoomManager + Mutex<br/>Atomic Counter"]
        WS_DOC["ws_document.go<br/>y-websocket Protocol<br/>Binary Sync"]
        HUB["hub.go<br/>Channel-based Hub<br/>Select + Directional Channels"]
    end

    MAIN --> APP
    MAIN --> HUB
    MAIN --> DBC
    APP --> R_AUTH --> C_AUTH
    APP --> R_WB --> C_WB
    APP --> R_CWB --> C_CWB
    APP --> R_DOC --> C_DOC
    C_AUTH --> U_JWT
    C_AUTH --> U_PWD
    C_OAUTH --> U_JWT
    APP --> M_AUTH
    APP --> M_CSRF
    APP --> M_RL
    APP --> WS
    APP --> WS_DOC

    style MAIN fill:#6366f1,stroke:#4f46e5,color:#fff
    style HUB fill:#ec4899,stroke:#db2777,color:#fff
    style WS fill:#14b8a6,stroke:#0d9488,color:#fff
    style DBC fill:#f59e0b,stroke:#d97706,color:#fff
```

---

## 3. Full System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        BROWSER["Browser"]
        NEXT["web<br/>Next.js :3000<br/>Dashboard + Auth"]
        VITE_WB["colab-whiteboard-web<br/>Vite :5173<br/>tldraw Whiteboard"]
        VITE_DOC["colab-word-web<br/>Vite :5174<br/>Yjs Document Editor"]
    end

    subgraph "API Layer - Go :4000"
        ROUTER["Chi Router"]

        subgraph "Middleware Pipeline"
            CORS["CORS"]
            JSON_MW["JSON Headers"]
            RATE["Rate Limiter<br/>Token Bucket"]
            CSRF_MW["CSRF Protection"]
            AUTH_MW["JWT Auth Middleware"]
        end

        subgraph "REST Endpoints"
            AUTH_EP["/api/auth/*<br/>Signup, Login, Refresh,<br/>Logout, OAuth"]
            WB_EP["/api/whiteboard/*<br/>Private Board CRUD"]
            CWB_EP["/api/collab-whiteboard/*<br/>Collab CRUD + Members"]
            DOC_EP["/api/documents/*<br/>Document CRUD + Members"]
            HEALTH["/health"]
        end

        subgraph "WebSocket Endpoints"
            WS_COLLAB["/ws/collab/:roomId<br/>Whiteboard Realtime"]
            WS_DOC_EP["/ws/document/:roomId<br/>y-websocket Binary"]
        end

        subgraph "Concurrency Layer"
            ROOM_MGR["RoomManager<br/>sync.Mutex + sync.RWMutex"]
            ATOMIC["Atomic Counter<br/>Active Connections"]
            HUB_CH["Hub<br/>Channels + Select + Goroutines"]
            WGROUP["WaitGroup<br/>Graceful Shutdown"]
        end
    end

    subgraph "Data Layer"
        PG[("PostgreSQL<br/>GORM ORM")]
        subgraph "Tables"
            T1["users"]
            T2["oauth_providers"]
            T3["refresh_tokens"]
            T4["whiteboard_data"]
            T5["collab_whiteboards"]
            T6["whiteboard_members"]
            T7["document_data"]
            T8["collab_documents"]
            T9["document_members"]
        end
    end

    BROWSER --> NEXT
    BROWSER --> VITE_WB
    BROWSER --> VITE_DOC

    NEXT -->|"REST API"| ROUTER
    VITE_WB -->|"REST API"| ROUTER
    VITE_WB -->|"WebSocket"| WS_COLLAB
    VITE_DOC -->|"REST API"| ROUTER
    VITE_DOC -->|"WebSocket"| WS_DOC_EP

    ROUTER --> CORS --> JSON_MW --> RATE --> AUTH_MW
    AUTH_MW --> AUTH_EP
    AUTH_MW --> WB_EP
    AUTH_MW --> CWB_EP
    AUTH_MW --> DOC_EP

    WS_COLLAB --> ROOM_MGR
    WS_DOC_EP --> ROOM_MGR
    ROOM_MGR --> HUB_CH
    ROOM_MGR --> ATOMIC

    AUTH_EP --> PG
    WB_EP --> PG
    CWB_EP --> PG
    DOC_EP --> PG

    style ROUTER fill:#6366f1,stroke:#4f46e5,color:#fff
    style PG fill:#f59e0b,stroke:#d97706,color:#fff
    style WS_COLLAB fill:#ec4899,stroke:#db2777,color:#fff
    style WS_DOC_EP fill:#14b8a6,stroke:#0d9488,color:#fff
    style ATOMIC fill:#10b981,stroke:#059669,color:#fff
    style HUB_CH fill:#8b5cf6,stroke:#7c3aed,color:#fff
```

---

## 4. Request Flow — Collaborative Whiteboard Session

```mermaid
sequenceDiagram
    participant U as User Browser
    participant D as Dashboard<br/>(Next.js :3000)
    participant API as Go API<br/>(:4000)
    participant DB as PostgreSQL
    participant WB as Whiteboard App<br/>(Vite :5173)
    participant WS as WebSocket<br/>Server

    Note over U,WS: 1. Authentication Flow
    U->>D: Visit /login
    D->>API: POST /api/auth/login<br/>{email, password}
    API->>API: bcrypt.ComparePassword()
    API->>API: GenerateJWT() + GenerateRefreshToken()
    API->>DB: Store RefreshToken
    API-->>D: {accessToken, refreshToken, expiresIn}
    D->>D: Store tokens in localStorage

    Note over U,WS: 2. Create Whiteboard
    U->>D: Click "New Whiteboard"
    D->>API: POST /api/collab-whiteboard<br/>Authorization: Bearer {JWT}
    API->>API: Auth Middleware → ValidateJWT()
    API->>API: Rate Limiter → TokenBucket.Allow()
    API->>DB: INSERT collab_whiteboards
    API-->>D: {id, roomCode, title}

    Note over U,WS: 3. Open Whiteboard (new tab)
    D->>WB: window.open(/collab/{roomId}?accessToken=...)
    WB->>WB: Parse tokens from URL params

    Note over U,WS: 4. WebSocket Connection
    WB->>WS: GET /ws/collab/{roomId}?token={JWT}
    WS->>WS: ValidateJWT(token)
    WS->>WS: RoomManager.AddClient()
    WS->>WS: atomic.AddInt64(&activeConnections, 1)
    WS-->>WB: WebSocket Upgraded ✓

    Note over U,WS: 5. Real-time Collaboration
    WS->>WB: Broadcast: {type: "presence",<br/>payload: {action: "joined", users: [...]}}

    U->>WB: Draw on canvas
    WB->>WS: {type: "draw", payload: {tldraw diff}}
    WS->>WS: json.Unmarshal → switch wsMsg.Type
    WS->>WS: json.Marshal(wsMsg)
    WS->>WS: BroadcastToRoom()<br/>(mutex.RLock → iterate clients)

    Note over U,WS: 6. Disconnect
    WB->>WS: Connection closed
    WS->>WS: defer: RemoveClient()
    WS->>WS: atomic.AddInt64(&activeConnections, -1)
    WS->>WS: Broadcast: {type: "presence",<br/>payload: {action: "left"}}

    Note over U,WS: 7. Graceful Shutdown (Ctrl+C)
    WS->>WS: os.Signal channel receives SIGINT
    WS->>WS: select: case sig := <-quit
    WS->>WS: hub.Stop() → close(h.stop)
    WS->>WS: server.Shutdown(ctx) — 30s timeout
    WS->>WS: wg.Wait() — all goroutines finish
```
