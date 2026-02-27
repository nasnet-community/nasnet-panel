package isolation

import (
	"go.uber.org/zap"
)

// DetectStrategy probes the system capabilities and selects the best isolation strategy.
// It tries to detect namespace support first; if not available, it falls back to IP binding.
func DetectStrategy(logger *zap.Logger) Strategy {
	if detectNamespaceSupport() {
		logger.Info("network namespaces supported", zap.String("strategy", "network-namespace"))
		return &NamespaceStrategy{logger: logger}
	}

	logger.Info("network namespaces not available, using fallback", zap.String("strategy", "ip-binding"))
	return &IPBindingStrategy{}
}
