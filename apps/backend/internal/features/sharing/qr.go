package sharing

import (
	"backend/internal/events"
	"context"
	"encoding/json"
	"fmt"

	"github.com/skip2/go-qrcode"
)

const (
	// QRCodeMaxSize is the maximum size in bytes for QR code data
	QRCodeMaxSize = 2048 // 2KB

	// QRCodeImageSize is the output PNG size in pixels
	QRCodeImageSize = 256

	// QRCodeErrorCorrection is the error correction level
	QRCodeErrorCorrection = qrcode.Medium
)

// QRCodeOptions configures QR code generation
type QRCodeOptions struct {
	Size             int                        // PNG size in pixels (default 256)
	ErrorCorrection  qrcode.RecoveryLevel       // Error correction level (default Medium)
	UserID           string                     // User generating the QR code
}

// GenerateQR generates a QR code PNG for a service export package
func (s *SharingService) GenerateQR(ctx context.Context, pkg *ServiceExportPackage, options QRCodeOptions) ([]byte, error) {
	// Serialize package to JSON
	data, err := json.Marshal(pkg)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize export package: %w", err)
	}

	// Enforce size limit
	if len(data) > QRCodeMaxSize {
		return nil, &QRCodeError{
			Code:    "V403",
			Message: fmt.Sprintf("export package too large for QR code: %d bytes (max %d)", len(data), QRCodeMaxSize),
			Size:    len(data),
		}
	}

	// Set defaults
	if options.Size == 0 {
		options.Size = QRCodeImageSize
	}
	if options.ErrorCorrection == 0 {
		options.ErrorCorrection = QRCodeErrorCorrection
	}

	// Generate QR code PNG
	qr, err := qrcode.New(string(data), options.ErrorCorrection)
	if err != nil {
		return nil, fmt.Errorf("failed to create QR code: %w", err)
	}

	pngData, err := qr.PNG(options.Size)
	if err != nil {
		return nil, fmt.Errorf("failed to encode QR code as PNG: %w", err)
	}

	// Publish QRCodeGeneratedEvent
	event := NewQRCodeGeneratedEvent(
		pkg.ServiceType,
		pkg.ServiceName,
		len(data),
		len(pngData),
		options.UserID,
		"sharing-service",
	)
	if err := s.eventBus.Publish(ctx, event); err != nil {
		// Log but don't fail - event publishing is non-critical
		fmt.Printf("Warning: failed to publish QRCodeGeneratedEvent: %v\n", err)
	}

	return pngData, nil
}

// QRCodeError represents an error during QR code generation
type QRCodeError struct {
	Code    string
	Message string
	Size    int // Actual size that exceeded limit
}

func (e *QRCodeError) Error() string {
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// QRCodeGeneratedEvent is emitted when a QR code is generated
type QRCodeGeneratedEvent struct {
	events.BaseEvent
	ServiceType      string `json:"serviceType"`
	ServiceName      string `json:"serviceName"`
	DataSize         int    `json:"dataSize"`         // JSON data size in bytes
	ImageSize        int    `json:"imageSize"`        // PNG image size in bytes
	GeneratedByUserID string `json:"generatedByUserId,omitempty"`
}

// Payload returns the JSON-serialized event payload
func (e *QRCodeGeneratedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewQRCodeGeneratedEvent creates a new QRCodeGeneratedEvent
func NewQRCodeGeneratedEvent(
	serviceType, serviceName string,
	dataSize, imageSize int,
	generatedByUserID, source string,
) *QRCodeGeneratedEvent {
	return &QRCodeGeneratedEvent{
		BaseEvent:         events.NewBaseEvent("service.qrcode.generated", events.PriorityLow, source),
		ServiceType:       serviceType,
		ServiceName:       serviceName,
		DataSize:          dataSize,
		ImageSize:         imageSize,
		GeneratedByUserID: generatedByUserID,
	}
}
