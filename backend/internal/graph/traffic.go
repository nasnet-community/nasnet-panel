package graph

import "time"

// TrafficData represents RX/TX traffic data with timestamp.
type TrafficData struct {
	RxBytes   int64     `json:"rxBytes"`
	TxBytes   int64     `json:"txBytes"`
	RX        string    `json:"rx"`
	TX        string    `json:"tx"`
	Timestamp time.Time `json:"timestamp"`
}
