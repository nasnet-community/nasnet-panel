package wgcfg

import (
	"bytes"
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"

	"golang.org/x/crypto/chacha20poly1305"
	"golang.org/x/crypto/curve25519"
)

// KeySize is the size in bytes of a WireGuard key.
const KeySize = 32

// Key is curve25519 key.
// It is used by WireGuard to represent public and preshared keys.
type Key [KeySize]byte

// NewPresharedKey generates a new random key.
func NewPresharedKey() (*Key, error) {
	var k [KeySize]byte
	_, err := rand.Read(k[:])
	if err != nil {
		return nil, err
	}
	return (*Key)(&k), nil
}

// ParseKey parses a base64-encoded key string.
func ParseKey(b64 string) (*Key, error) { return parseKeyBase64(base64.StdEncoding, b64) }

// ParseHexKey parses a hex-encoded key string.
func ParseHexKey(s string) (Key, error) {
	b, err := hex.DecodeString(s)
	if err != nil {
		return Key{}, &ParseError{"invalid hex key: " + err.Error(), s}
	}
	if len(b) != KeySize {
		return Key{}, &ParseError{fmt.Sprintf("invalid hex key length: %d", len(b)), s}
	}

	var key Key
	copy(key[:], b)
	return key, nil
}

// ParsePrivateHexKey parses a hex-encoded private key string.
func ParsePrivateHexKey(v string) (PrivateKey, error) {
	k, err := ParseHexKey(v)
	if err != nil {
		return PrivateKey{}, err
	}
	pk := PrivateKey(k)
	if pk.IsZero() {
		// Do not clamp a zero key, pass the zero through
		// (much like NaN propagation) so that IsZero reports
		// a useful result.
		return pk, nil
	}
	pk.clamp()
	return pk, nil
}

// Base64 returns the base64 encoding of k.
func (k Key) Base64() string { return base64.StdEncoding.EncodeToString(k[:]) }

// String returns a short human-readable representation (not the full key).
func (k Key) String() string { return "pub:" + k.Base64()[:8] }

// HexString returns the hex encoding of k.
func (k Key) HexString() string { return hex.EncodeToString(k[:]) }

// Equal reports whether k and k2 are equal.
func (k Key) Equal(k2 Key) bool { return subtle.ConstantTimeCompare(k[:], k2[:]) == 1 }

// ShortString returns a short bracket-enclosed representation.
func (k *Key) ShortString() string {
	if k.IsZero() {
		return "[empty]"
	}
	long := k.String()
	if len(long) < 10 {
		return "invalid"
	}
	return "[" + long[0:4] + "…" + long[len(long)-5:len(long)-1] + "]"
}

// IsZero reports whether k is the zero key.
func (k *Key) IsZero() bool {
	if k == nil {
		return true
	}
	var zeros Key
	return subtle.ConstantTimeCompare(zeros[:], k[:]) == 1
}

// MarshalJSON implements json.Marshaler.
func (k *Key) MarshalJSON() ([]byte, error) {
	if k == nil {
		return []byte("null"), nil
	}
	buf := new(bytes.Buffer)
	fmt.Fprintf(buf, `"%x"`, k[:])
	return buf.Bytes(), nil
}

// UnmarshalJSON implements json.Unmarshaler.
func (k *Key) UnmarshalJSON(b []byte) error {
	if k == nil {
		return errors.New("wgcfg.Key: UnmarshalJSON on nil pointer")
	}
	if len(b) < 3 || b[0] != '"' || b[len(b)-1] != '"' {
		return errors.New("wgcfg.Key: UnmarshalJSON not given a string")
	}
	b = b[1 : len(b)-1]
	key, err := ParseHexKey(string(b))
	if err != nil {
		return fmt.Errorf("wgcfg.Key: UnmarshalJSON: %w", err)
	}
	copy(k[:], key[:])
	return nil
}

// LessThan reports whether k is less than b in byte-wise order.
func (k *Key) LessThan(b *Key) bool {
	for i := range k {
		if k[i] < b[i] {
			return true
		}
		if k[i] > b[i] {
			return false
		}
	}
	return false
}

// PrivateKey is curve25519 key.
// It is used by WireGuard to represent private keys.
type PrivateKey [KeySize]byte

// NewPrivateKey generates a new curve25519 secret key.
// It conforms to the format described on https://cr.yp.to/ecdh.html.
func NewPrivateKey() (PrivateKey, error) {
	k, err := NewPresharedKey()
	if err != nil {
		return PrivateKey{}, err
	}
	k[0] &= 248
	k[31] = (k[31] & 127) | 64
	return PrivateKey(*k), nil
}

// ParsePrivateKey parses a base64-encoded private key.
func ParsePrivateKey(b64 string) (*PrivateKey, error) {
	k, err := parseKeyBase64(base64.StdEncoding, b64)
	return (*PrivateKey)(k), err
}

// String returns the base64 encoding of k.
func (k *PrivateKey) String() string { return base64.StdEncoding.EncodeToString(k[:]) }

// HexString returns the hex encoding of k.
func (k *PrivateKey) HexString() string { return hex.EncodeToString(k[:]) }

// Equal reports whether k and k2 are equal.
func (k *PrivateKey) Equal(k2 PrivateKey) bool {
	return subtle.ConstantTimeCompare(k[:], k2[:]) == 1
}

// IsZero reports whether k is the zero key.
func (k *PrivateKey) IsZero() bool {
	pk := Key(*k)
	return pk.IsZero()
}

func (k *PrivateKey) clamp() {
	k[0] &= 248
	k[31] = (k[31] & 127) | 64
}

// Public computes the public key matching this curve25519 secret key.
func (k *PrivateKey) Public() Key {
	pk := Key(*k)
	if pk.IsZero() {
		panic("Tried to generate emptyPrivateKey.Public()")
	}
	var p [KeySize]byte
	curve25519.ScalarBaseMult(&p, (*[KeySize]byte)(k))
	return Key(p)
}

// MarshalText implements encoding.TextMarshaler.
func (k PrivateKey) MarshalText() ([]byte, error) {
	buf := new(bytes.Buffer)
	fmt.Fprintf(buf, `privkey:%x`, k[:])
	return buf.Bytes(), nil
}

// UnmarshalText implements encoding.TextUnmarshaler.
func (k *PrivateKey) UnmarshalText(b []byte) error {
	s := string(b)
	if !strings.HasPrefix(s, `privkey:`) {
		return errors.New("wgcfg.PrivateKey: UnmarshalText not given a private-key string")
	}
	s = strings.TrimPrefix(s, `privkey:`)
	key, err := ParseHexKey(s)
	if err != nil {
		return fmt.Errorf("wgcfg.PrivateKey: UnmarshalText: %w", err)
	}
	copy(k[:], key[:])
	return nil
}

// SharedSecret computes the Diffie-Hellman shared secret between k and pub.
func (k PrivateKey) SharedSecret(pub Key) (ss [KeySize]byte) {
	apk := (*[KeySize]byte)(&pub)
	ask := (*[KeySize]byte)(&k)
	curve25519.ScalarMult(&ss, ask, apk) //nolint:staticcheck // SA1019: kept for compatibility; low-order points are not a concern in this context
	return ss
}

func parseKeyBase64(enc *base64.Encoding, s string) (*Key, error) {
	k, err := enc.DecodeString(s)
	if err != nil {
		return nil, &ParseError{"Invalid key: " + err.Error(), s}
	}
	if len(k) != KeySize {
		return nil, &ParseError{"Keys must decode to exactly 32 bytes", s}
	}
	var key Key
	copy(key[:], k)
	return &key, nil
}

// ParseSymmetricKey parses a base64-encoded symmetric key.
func ParseSymmetricKey(b64 string) (SymmetricKey, error) {
	k, err := parseKeyBase64(base64.StdEncoding, b64)
	if err != nil {
		return SymmetricKey{}, err
	}
	return SymmetricKey(*k), nil
}

// ParseSymmetricHexKey parses a hex-encoded symmetric key.
func ParseSymmetricHexKey(s string) (SymmetricKey, error) {
	b, err := hex.DecodeString(s)
	if err != nil {
		return SymmetricKey{}, &ParseError{"invalid symmetric hex key: " + err.Error(), s}
	}
	if len(b) != chacha20poly1305.KeySize {
		return SymmetricKey{}, &ParseError{fmt.Sprintf("invalid symmetric hex key length: %d", len(b)), s}
	}
	var key SymmetricKey
	copy(key[:], b)
	return key, nil
}

// SymmetricKey is a chacha20poly1305 key.
// It is used by WireGuard to represent pre-shared symmetric keys.
type SymmetricKey [chacha20poly1305.KeySize]byte

// Base64 returns the base64 encoding of k.
func (k SymmetricKey) Base64() string { return base64.StdEncoding.EncodeToString(k[:]) }

// String returns a short human-readable representation (not the full key).
func (k SymmetricKey) String() string { return "sym:" + k.Base64()[:8] }

// HexString returns the hex encoding of k.
func (k SymmetricKey) HexString() string { return hex.EncodeToString(k[:]) }

// IsZero reports whether k is the zero key.
func (k SymmetricKey) IsZero() bool { return k.Equal(SymmetricKey{}) }

// Equal reports whether k and k2 are equal.
func (k SymmetricKey) Equal(k2 SymmetricKey) bool {
	return subtle.ConstantTimeCompare(k[:], k2[:]) == 1
}
