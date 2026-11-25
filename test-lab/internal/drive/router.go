package drive

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"

	"nasnet-panel/test-lab/internal/sh"
)

type Router struct {
	NS       string
	Labsvc   string
	Address  string
	User     string
	Password string
}

func (r *Router) Run(ctx context.Context, cmd string, words ...string) ([]map[string]string, error) {
	args := sh.InNS(r.NS, r.Labsvc, "ros",
		"-addr", r.Address,
		"-user", r.User,
		"-pass", r.Password,
		"-cmd", cmd,
	)
	for _, w := range words {
		args = append(args, "-q", w)
	}

	out, err := sh.Output(ctx, args...)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", cmd, err)
	}

	var rows []map[string]string
	if err := json.Unmarshal(out, &rows); err != nil {
		return nil, fmt.Errorf("%s: decode: %w", cmd, err)
	}
	return rows, nil
}

func (r *Router) Print(ctx context.Context, path string, queries ...string) ([]map[string]string, error) {
	return r.Run(ctx, path+"/print", queries...)
}

func (r *Router) PrintWhere(ctx context.Context, path string, where map[string]string) ([]map[string]string, error) {
	return r.Print(ctx, path, Query(where)...)
}

func (r *Router) SetWhere(ctx context.Context, path string, where, fields map[string]string) (int, error) {
	rows, err := r.PrintWhere(ctx, path, where)
	if err != nil {
		return 0, err
	}
	for _, row := range rows {
		words := []string{"=.id=" + row[".id"]}
		words = append(words, Attributes(fields)...)
		if _, err := r.Run(ctx, path+"/set", words...); err != nil {
			return 0, err
		}
	}
	return len(rows), nil
}

func (r *Router) Fetch(ctx context.Context, url string) (string, error) {
	rows, err := r.Run(ctx, "/tool/fetch", "=url="+url, "=output=user", "=check-certificate=no")
	if err != nil {
		return "", err
	}
	for _, row := range rows {
		if data, ok := row["data"]; ok {
			return data, nil
		}
	}
	return "", fmt.Errorf("fetch %s returned no data", url)
}

func Query(where map[string]string) []string {
	keys := sortedKeys(where)
	words := make([]string, 0, len(keys))
	for _, k := range keys {
		words = append(words, "?"+k+"="+where[k])
	}
	return words
}

func Attributes(fields map[string]string) []string {
	keys := sortedKeys(fields)
	words := make([]string, 0, len(keys))
	for _, k := range keys {
		words = append(words, "="+k+"="+fields[k])
	}
	return words
}

func sortedKeys(m map[string]string) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}
