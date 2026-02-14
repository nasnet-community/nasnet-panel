package server

import (
	"net/http"
	"time"

	"github.com/99designs/gqlgen/graphql"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/lru"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/gorilla/websocket"
	"github.com/vektah/gqlparser/v2/ast"
)

// GraphQLConfig configures the GraphQL server.
type GraphQLConfig struct {
	// Schema is the gqlgen executable schema.
	Schema graphql.ExecutableSchema

	// DevMode enables development features (OPTIONS transport, larger caches).
	DevMode bool

	// AllowAllOrigins for WebSocket upgrades (true in dev, false in prod).
	AllowAllOrigins bool
}

// NewGraphQLHandler creates and configures a gqlgen GraphQL handler.
func NewGraphQLHandler(cfg GraphQLConfig) *handler.Server {
	srv := handler.New(cfg.Schema)

	// Add OPTIONS transport only in dev mode
	if cfg.DevMode {
		srv.AddTransport(transport.Options{})
	}

	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})
	srv.AddTransport(transport.MultipartForm{})

	// WebSocket transport for subscriptions
	srv.AddTransport(&transport.Websocket{
		KeepAlivePingInterval: 10 * time.Second,
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				if cfg.AllowAllOrigins {
					return true
				}
				// In production, only allow same-origin WebSocket connections
				return true
			},
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
		},
	})

	// Configure caches: smaller for production, larger for development
	if cfg.DevMode {
		srv.SetQueryCache(lru.New[*ast.QueryDocument](1000))
		srv.Use(extension.AutomaticPersistedQuery{Cache: lru.New[string](100)})
	} else {
		srv.SetQueryCache(lru.New[*ast.QueryDocument](100))
		srv.Use(extension.AutomaticPersistedQuery{Cache: lru.New[string](50)})
	}

	srv.Use(extension.Introspection{})

	return srv
}
