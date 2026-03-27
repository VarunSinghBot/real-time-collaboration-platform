# Go Syllabus — Implementation Tracker (Collab Platform)

Comprehensive mapping of every Unit 4 & 5 syllabus topic to its implementation in `collab-platform/apps/api`.

---

## Unit 4 — Pointers and Application

| # | Topic | Status | File | Details |
|---|---|---|---|---|
| 1 | Pointer introduction & use | ✅ | [ws.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/websocket/ws.go) | `*Client`, `*RoomManager` pointer types used throughout |
| 2 | Method sets | ✅ | [models/](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/internal/api/models/) | Value receivers `(User) TableName()` + pointer receivers `(*User) BeforeCreate()` |
| 3 | Passing pointers to functions | ✅ | [ws.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/websocket/ws.go#L56) | `AddClient(roomID string, client *Client)` |
| 4 | Returning pointers | ✅ | [ratelimit.middleware.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/internal/api/middlewares/ratelimit.middleware.go#L31) | `NewRateLimiter()` returns `*RateLimiter` |
| 5 | Pass by value vs pointer | ✅ | [models/](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/internal/api/models/) | Value receiver `(User) TableName()` vs pointer `(*User) BeforeCreate()` — same struct, both styles |
| 6 | JSON Marshal | ✅ | [ws.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/websocket/ws.go#L178) | `json.Marshal(WSMessage{...})` — 8 usages across ws.go and controllers |
| 7 | JSON Unmarshal | ✅ | [ws.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/websocket/ws.go#L218) | `json.Unmarshal(msg, &wsMsg)` |
| 8 | bcrypt | ✅ | [password.util.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/internal/api/utils/password.util.go) | `bcrypt.GenerateFromPassword` + `bcrypt.CompareHashAndPassword` |
| 9 | Testing | ✅ **NEW** | [password.util_test.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/internal/api/utils/password.util_test.go) | Unit tests for password hashing |
| 10 | Table tests | ✅ **NEW** | [jwt.util_test.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/internal/api/utils/jwt.util_test.go) | `TestValidateJWT_TableDriven` — 5 scenarios |
| 11 | Benchmark | ✅ **NEW** | [password.util_test.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/internal/api/utils/password.util_test.go) | `BenchmarkHashPassword`, `BenchmarkComparePassword` |
| 12 | Coverage | ✅ **NEW** | Run: `go test ./... -cover` | Enabled across all test files |

> **Run tests:** `go test ./internal/api/utils/ -v -cover -bench=.`

---

## Unit 5 — Concurrency

| # | Topic | Status | File | Details |
|---|---|---|---|---|
| 1 | Concurrency vs parallelism | ✅ **NEW** | [main.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/cmd/main.go#L7) | Explained in comments — server + signal handler as concurrent goroutines |
| 2 | WaitGroup | ✅ **NEW** | [main.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/cmd/main.go#L72) | `sync.WaitGroup` waits for HTTP server + hub goroutines before exit |
| 3 | Race condition | ✅ **NEW** | [ws_test.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/websocket/ws_test.go) | `TestRoomManager_ConcurrentAccess` — 50 goroutines, run with `go test -race` |
| 4 | Mutex | ✅ | [ws.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/websocket/ws.go#L27), [ratelimit.middleware.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/internal/api/middlewares/ratelimit.middleware.go#L27) | `sync.Mutex` and `sync.RWMutex` for thread-safe access |
| 5 | Atomic | ✅ **NEW** | [ws.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/websocket/ws.go#L43) | `atomic.AddInt64(&activeConnections, 1)` — lock-free connection counter |
| 6 | Goroutines | ✅ | [main.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/cmd/main.go#L79), [ratelimit.middleware.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/internal/api/middlewares/ratelimit.middleware.go#L39) | `go hub.Run()`, `go rl.cleanupVisitors()`, `go func(){...}` |
| 7 | Channels | ✅ **NEW** | [hub.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/websocket/hub.go), [main.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/cmd/main.go#L63) | `make(chan os.Signal, 1)`, `make(chan *registration)`, `make(chan *HubMessage, 256)` |
| 8 | Directional channels | ✅ **NEW** | [hub.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/websocket/hub.go#L177) | `SendToChannel(ch chan<- string)`, `ReceiveFromChannel(ch <-chan string)` |
| 9 | Range over channel | ✅ **NEW** | [hub.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/websocket/hub.go#L163) | `DrainBroadcast()` — `for msg := range h.broadcast` |
| 10 | Select | ✅ **NEW** | [hub.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/websocket/hub.go#L72), [main.go](file:///d:/Sx%20Varun/Sx%20Code/Sx%20Projects/collab-platform/apps/api/cmd/main.go#L95) | Hub `select` multiplexes 4 channels; main `select` for signal vs error |

> **Run concurrency tests:** `go test -race -v ./websocket/`

---

## Files Added / Modified

| Action | File | Syllabus Topics |
|---|---|---|
| **NEW** | `utils/password.util_test.go` | Testing, Table tests, Benchmark, Coverage |
| **NEW** | `utils/jwt.util_test.go` | Testing, Table tests |
| **NEW** | `middlewares/ratelimit.middleware_test.go` | Testing, Table tests, Benchmark |
| **NEW** | `middlewares/csrf.middleware_test.go` | Testing, Table tests |
| **MODIFIED** | `websocket/ws.go` | Atomic |
| **MODIFIED** | `cmd/main.go` | WaitGroup, Channels, Select, Concurrency vs Parallelism |
| **NEW** | `websocket/hub.go` | Goroutines, Channels, Directional, Range, Select |
| **NEW** | `websocket/ws_test.go` | Race condition |

## Quick Commands

```bash
# Run all tests with race detector and coverage
go test ./... -race -cover -v

# Run benchmarks
go test ./internal/api/utils/ -bench=. -benchmem

# Run just the concurrency tests
go test -race -v ./websocket/
```
