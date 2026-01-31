package auth

import (
	"crypto/rand"
	"io"
)

func init() {
	// Initialize the crypto random reader
	cryptoRandFill = func(b []byte) (int, error) {
		return io.ReadFull(rand.Reader, b)
	}

	readCryptoRand = func(b []byte) (int, error) {
		return io.ReadFull(rand.Reader, b)
	}
}
