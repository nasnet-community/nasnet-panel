package routeros

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"fmt"
	"math/big"
	"strconv"
	"strings"
	"time"
)

// Key Usage Constants
const (
	KeyUsageCodeSign          = "code-sign"
	KeyUsageDataEncipherment  = "data-encipherment"
	KeyUsageDVCS              = "dvcs"
	KeyUsageKeyAgreement      = "key-agreement"
	KeyUsageOCSPSign          = "ocsp-sign"
	KeyUsageTLSServer         = "tls-server"
	KeyUsageContentCommitment = "content-commitment"
	KeyUsageDecipherOnly      = "decipher-only"
	KeyUsageEmailProtect      = "email-protect"
	KeyUsageKeyCertSign       = "key-cert-sign"
	KeyUsageTimestamp         = "timestamp"
	KeyUsageCRLSign           = "crl-sign"
	KeyUsageDigitalSignature  = "digital-signature"
	KeyUsageEncipherOnly      = "encipher-only"
	KeyUsageKeyEncipherment   = "key-encipherment"
	KeyUsageTLSClient         = "tls-client"
)

// CertificateInfo holds information about a certificate.
type CertificateInfo struct {
	Name          string
	CommonName    string
	Subject       string
	Issuer        string
	ValidFrom     string
	ValidTill     string
	KeySize       int
	Expired       bool
	HasPrivateKey bool
	Trusted       bool
	TrustStore    string
	SerialNumber  string
	Fingerprint   string
	ExpiresAfter  string
}

// AddCertificateParams contains parameters for adding a certificate via RouterOS API.
type AddCertificateParams struct {
	Name             string
	CommonName       string
	KeySize          int
	DaysValid        int
	Country          string
	Organization     string
	OrganizationUnit string
	Province         string
	Locality         string
	Trusted          bool
	TrustStore       string
}

// ImportCertificateParams contains parameters for importing a certificate.
type ImportCertificateParams struct {
	Name       string
	CertPEM    string
	KeyPEM     string
	Passphrase string
	Trusted    bool
	TrustStore string
}

// ImportCertificateResult contains the result of a certificate import operation.
type ImportCertificateResult struct {
	CertificatesImported int
	PrivateKeysImported  int
	FilesImported        int
	DecryptionFailures   int
	KeysWithNoCert       int
}

// SelfSignedCertificateParams contains parameters for generating a self-signed certificate.
type SelfSignedCertificateParams struct {
	CommonName       string
	Organization     string
	OrganizationUnit string
	Country          string
	Province         string
	Locality         string
	ValidDays        int
	KeySize          int
}

// GenerateSelfSignedCertificate generates a self-signed X.509 certificate with a corresponding private key.
// Returns the certificate and private key in PEM format.
func GenerateSelfSignedCertificate(params SelfSignedCertificateParams) (certPEM, keyPEM string, err error) {
	if params.ValidDays == 0 {
		params.ValidDays = 365
	}
	if params.KeySize == 0 {
		params.KeySize = 2048
	}

	privateKey, err := rsa.GenerateKey(rand.Reader, params.KeySize)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate private key: %w", err)
	}

	serialNumber, err := rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 128))
	if err != nil {
		return "", "", fmt.Errorf("failed to generate serial number: %w", err)
	}

	subject := pkix.Name{
		CommonName: params.CommonName,
	}

	if params.Country != "" {
		subject.Country = []string{params.Country}
	}
	if params.Province != "" {
		subject.Province = []string{params.Province}
	}
	if params.Locality != "" {
		subject.Locality = []string{params.Locality}
	}
	if params.Organization != "" {
		subject.Organization = []string{params.Organization}
	}
	if params.OrganizationUnit != "" {
		subject.OrganizationalUnit = []string{params.OrganizationUnit}
	}

	now := time.Now()
	cert := x509.Certificate{
		SerialNumber: serialNumber,
		Subject:      subject,
		NotBefore:    now,
		NotAfter:     now.AddDate(0, 0, params.ValidDays),
		KeyUsage:     x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
	}

	certBytes, err := x509.CreateCertificate(rand.Reader, &cert, &cert, &privateKey.PublicKey, privateKey)
	if err != nil {
		return "", "", fmt.Errorf("failed to create certificate: %w", err)
	}

	certPEM = string(pem.EncodeToMemory(&pem.Block{
		Type:  "CERTIFICATE",
		Bytes: certBytes,
	}))

	privKeyBytes := x509.MarshalPKCS1PrivateKey(privateKey)
	keyPEM = string(pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: privKeyBytes,
	}))

	return certPEM, keyPEM, nil
}

// ParseCertificatePEM parses a PEM-encoded certificate and extracts certificate information.
func ParseCertificatePEM(certPEM string) (*CertificateInfo, error) {
	block, _ := pem.Decode([]byte(certPEM))
	if block == nil {
		return nil, fmt.Errorf("failed to parse certificate PEM")
	}

	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse certificate: %w", err)
	}

	keySize := 0
	if pubKey, ok := cert.PublicKey.(*rsa.PublicKey); ok {
		keySize = pubKey.N.BitLen()
	}

	return &CertificateInfo{
		CommonName: cert.Subject.CommonName,
		Subject:    cert.Subject.String(),
		Issuer:     cert.Issuer.String(),
		ValidFrom:  cert.NotBefore.Format("2006-01-02 15:04:05"),
		ValidTill:  cert.NotAfter.Format("2006-01-02 15:04:05"),
		KeySize:    keySize,
		Expired:    cert.NotAfter.Before(time.Now()),
	}, nil
}

// GetCertificates retrieves all certificates from RouterOS.
func (c *Client) GetCertificates() ([]CertificateInfo, error) {
	results, err := c.GetAll("/certificate")
	if err != nil {
		return nil, fmt.Errorf("failed to query certificates: %w", err)
	}

	var certs []CertificateInfo
	for _, result := range results {
		cert := CertificateInfo{
			Name: result["name"],
		}

		if commonName, ok := result["common-name"]; ok {
			cert.CommonName = commonName
		}
		if subject, ok := result["subject"]; ok {
			cert.Subject = subject
		}
		if issuer, ok := result["issuer"]; ok {
			cert.Issuer = issuer
		}
		if validFrom, ok := result["not-before"]; ok {
			cert.ValidFrom = validFrom
		}
		if validTill, ok := result["not-after"]; ok {
			cert.ValidTill = validTill
		}
		if serialNum, ok := result["serial-number"]; ok {
			cert.SerialNumber = serialNum
		}
		if fingerprint, ok := result["fingerprint"]; ok {
			cert.Fingerprint = fingerprint
		}
		if expiresAfter, ok := result["expires-after"]; ok {
			cert.ExpiresAfter = expiresAfter
		}
		if trusted, ok := result["trusted"]; ok {
			cert.Trusted = trusted == "true" || trusted == "yes"
		}
		if trustStore, ok := result["trust-store"]; ok {
			cert.TrustStore = trustStore
		}

		// Check for private key presence
		if flags, ok := result[".flags"]; ok {
			cert.HasPrivateKey = strings.Contains(flags, "K")
		}

		certs = append(certs, cert)
	}

	return certs, nil
}

// GetCertificate retrieves a specific certificate by name.
func (c *Client) GetCertificate(name string) (*CertificateInfo, error) {
	results, err := c.GetAll("/certificate", "?=name="+name)
	if err != nil {
		return nil, fmt.Errorf("failed to query certificate: %w", err)
	}

	if len(results) == 0 {
		return nil, fmt.Errorf("certificate not found: %s", name)
	}

	result := results[0]
	cert := &CertificateInfo{
		Name:       result["name"],
		CommonName: result["common-name"],
		Subject:    result["subject"],
		Issuer:     result["issuer"],
		ValidFrom:  result["not-before"],
		ValidTill:  result["not-after"],
	}

	if serialNum, ok := result["serial-number"]; ok {
		cert.SerialNumber = serialNum
	}
	if fingerprint, ok := result["fingerprint"]; ok {
		cert.Fingerprint = fingerprint
	}
	if expiresAfter, ok := result["expires-after"]; ok {
		cert.ExpiresAfter = expiresAfter
	}
	if trusted, ok := result["trusted"]; ok {
		cert.Trusted = trusted == "true" || trusted == "yes"
	}
	if trustStore, ok := result["trust-store"]; ok {
		cert.TrustStore = trustStore
	}

	// Check for private key presence
	if flags, ok := result[".flags"]; ok {
		cert.HasPrivateKey = strings.Contains(flags, "K")
	}

	// Extract key size from certificate if available
	if keySize, ok := result["key-size"]; ok {
		if size, err := strconv.Atoi(keySize); err == nil {
			cert.KeySize = size
		}
	}

	return cert, nil
}

// AddCertificate creates a new certificate on RouterOS device with the specified parameters.
// This uses the /certificate/add command to create a certificate and optionally signs it.
// The function builds the certificate with the provided parameters and then signs it if name is provided.
// Returns the certificate name if successful.
func (c *Client) AddCertificate(params AddCertificateParams) (string, error) {
	if params.Name == "" {
		return "", fmt.Errorf("certificate name is required")
	}

	if params.CommonName == "" {
		return "", fmt.Errorf("common-name is required")
	}

	// Check if certificate with this name already exists
	existingCert, checkErr := c.GetCertificate(params.Name)
	if checkErr == nil && existingCert != nil {
		return "", fmt.Errorf("certificate with name '%s' already exists", params.Name)
	}

	args := []string{
		"=name=" + params.Name,
		"=common-name=" + params.CommonName,
	}

	if params.KeySize == 0 {
		params.KeySize = 2048
	}
	args = append(args, "=key-size="+strconv.Itoa(params.KeySize))

	if params.DaysValid == 0 {
		params.DaysValid = 365
	}
	args = append(args, "=days-valid="+strconv.Itoa(params.DaysValid))

	if params.Country != "" {
		args = append(args, "=country="+params.Country)
	}

	if params.Organization != "" {
		args = append(args, "=organization="+params.Organization)
	}

	if params.OrganizationUnit != "" {
		args = append(args, "=organization-unit="+params.OrganizationUnit)
	}

	if params.Province != "" {
		args = append(args, "=province="+params.Province)
	}

	if params.Locality != "" {
		args = append(args, "=locality="+params.Locality)
	}

	if params.Trusted {
		args = append(args, "=trusted=yes")
	}

	if params.TrustStore != "" {
		args = append(args, "=trust-store="+params.TrustStore)
	}

	_, err := c.Execute("/certificate/add", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add certificate: %w", err)
	}

	return params.Name, nil
}

// SignCertificate signs a certificate on RouterOS device.
// This uses the /certificate/sign command to sign the certificate.
// If signingCertName is empty, the certificate is self-signed.
// If signingCertName is provided, the certificate is signed with the specified signing certificate.
func (c *Client) SignCertificate(name string, signingCertName ...string) error {
	if name == "" {
		return fmt.Errorf("certificate name is required")
	}

	results, err := c.GetAll("/certificate", "?=name="+name)
	if err != nil {
		return fmt.Errorf("failed to find certificate: %w", err)
	}

	if len(results) == 0 {
		return fmt.Errorf("certificate not found: %s", name)
	}

	certID := results[0][".id"]
	args := []string{"=.id=" + certID}

	if len(signingCertName) > 0 && signingCertName[0] != "" {
		sigResults, err := c.GetAll("/certificate", "?=name="+signingCertName[0])
		if err != nil {
			return fmt.Errorf("failed to find signing certificate: %w", err)
		}

		if len(sigResults) == 0 {
			return fmt.Errorf("signing certificate not found: %s", signingCertName[0])
		}

		sigCertID := sigResults[0][".id"]
		args = append(args, "=ca="+sigCertID)
	}

	_, err = c.Execute("/certificate/sign", args...)
	if err != nil {
		return fmt.Errorf("failed to sign certificate: %w", err)
	}

	return nil
}

// ImportCertificate imports a certificate and private key into RouterOS using MikroTik API.
// According to MikroTik API, certificate import can be done via /certificate/import command.
// The params.CertPEM should contain the PEM-encoded certificate data.
// The params.KeyPEM should contain the PEM-encoded private key (optional).
// Returns a summary of imported certificates, private keys, and files.
func (c *Client) ImportCertificate(params ImportCertificateParams) (*ImportCertificateResult, error) {
	args := []string{
		"name=" + params.Name,
		"certificate=" + params.CertPEM,
	}

	if params.KeyPEM != "" {
		args = append(args, "=key="+params.KeyPEM)
	}

	if params.Passphrase != "" {
		args = append(args, "=passphrase="+params.Passphrase)
	}

	if params.TrustStore != "" {
		args = append(args, "=trust-store="+params.TrustStore)
	}

	if params.Trusted {
		args = append(args, "=trusted=yes")
	} else {
		args = append(args, "=trusted=no")
	}

	reply, err := c.Execute("/certificate/import", args...)
	if err != nil {
		return nil, fmt.Errorf("failed to import certificate: %w", err)
	}

	result := &ImportCertificateResult{
		CertificatesImported: parseMapInt(reply.Done.Map, "certificates-imported"),
		PrivateKeysImported:  parseMapInt(reply.Done.Map, "private-keys-imported"),
		FilesImported:        parseMapInt(reply.Done.Map, "files-imported"),
		DecryptionFailures:   parseMapInt(reply.Done.Map, "decryption-failures"),
		KeysWithNoCert:       parseMapInt(reply.Done.Map, "keys-with-no-certificate"),
	}

	return result, nil
}

// parseMapInt extracts an integer value from a map, returning 0 if not found or invalid.
func parseMapInt(data map[string]string, key string) int {
	if val, ok := data[key]; ok {
		if num, err := strconv.Atoi(strings.TrimSpace(val)); err == nil {
			return num
		}
	}
	return 0
}

// RemoveCertificate removes a certificate from RouterOS by name.
func (c *Client) RemoveCertificate(name string) error {
	results, err := c.GetAll("/certificate", "?=name="+name)
	if err != nil {
		return fmt.Errorf("failed to find certificate: %w", err)
	}

	if len(results) == 0 {
		return fmt.Errorf("certificate not found: %s", name)
	}

	certID := results[0][".id"]
	_, err = c.Remove("/certificate", "=.id="+certID)
	if err != nil {
		return fmt.Errorf("failed to remove certificate: %w", err)
	}

	return nil
}

// ExportCertificate exports a certificate from RouterOS.
func (c *Client) ExportCertificate(name string) (certPEM, keyPEM string, err error) {
	cert, err := c.GetCertificate(name)
	if err != nil {
		return "", "", fmt.Errorf("failed to get certificate: %w", err)
	}

	results, err := c.GetAll("/certificate", "?=name="+name)
	if err != nil {
		return "", "", fmt.Errorf("failed to query certificate data: %w", err)
	}

	if len(results) == 0 {
		return "", "", fmt.Errorf("certificate data not found: %s", name)
	}

	certPEM = results[0]["certificate"]
	keyPEM = results[0]["key"]

	if certPEM == "" {
		return "", "", fmt.Errorf("certificate %s has no certificate data", cert.Name)
	}

	return certPEM, keyPEM, nil
}

// RenameCertificate renames a certificate in RouterOS.
func (c *Client) RenameCertificate(oldName, newName string) error {
	results, err := c.GetAll("/certificate", "?=name="+oldName)
	if err != nil {
		return fmt.Errorf("failed to find certificate: %w", err)
	}

	if len(results) == 0 {
		return fmt.Errorf("certificate not found: %s", oldName)
	}

	certID := results[0][".id"]
	_, err = c.Set("/certificate", "=.id="+certID, "=name="+newName)
	if err != nil {
		return fmt.Errorf("failed to rename certificate: %w", err)
	}

	return nil
}

// SetCertificateTrusted sets the trusted flag for a certificate in RouterOS.
// According to MikroTik API, certificates can be marked as trusted for host verification.
func (c *Client) SetCertificateTrusted(name string, trusted bool) error {
	results, err := c.GetAll("/certificate", "?=name="+name)
	if err != nil {
		return fmt.Errorf("failed to find certificate: %w", err)
	}

	if len(results) == 0 {
		return fmt.Errorf("certificate not found: %s", name)
	}

	certID := results[0][".id"]
	trustStr := "no"
	if trusted {
		trustStr = "yes"
	}

	_, err = c.Set("/certificate", "=.id="+certID, "=trusted="+trustStr)
	if err != nil {
		return fmt.Errorf("failed to set certificate trusted flag: %w", err)
	}

	return nil
}

// SetCertificateTrustStore sets the trust-store for a certificate in RouterOS.
// According to MikroTik API, trust-store specifies which services can use the certificate.
// Valid values: all, capsman, dns, email, ipsec, mqtt, openflow, radius, sstp, userman, www, api, container, dot1x, fetch, lora, netwatch, ovpn, tr069, wpa-eap.
func (c *Client) SetCertificateTrustStore(name, trustStore string) error {
	results, err := c.GetAll("/certificate", "?=name="+name)
	if err != nil {
		return fmt.Errorf("failed to find certificate: %w", err)
	}

	if len(results) == 0 {
		return fmt.Errorf("certificate not found: %s", name)
	}

	certID := results[0][".id"]
	_, err = c.Set("/certificate", "=.id="+certID, "trust-store="+trustStore)
	if err != nil {
		return fmt.Errorf("failed to set certificate trust-store: %w", err)
	}

	return nil
}

// ListCertificates lists all certificates with their details.
func (c *Client) ListCertificates() ([]CertificateInfo, error) {
	results, err := c.GetAll("/certificate")
	if err != nil {
		return nil, fmt.Errorf("failed to list certificates: %w", err)
	}

	var certs []CertificateInfo
	for _, result := range results {
		cert := CertificateInfo{
			Name:       result["name"],
			CommonName: result["common-name"],
			Subject:    result["subject"],
			Issuer:     result["issuer"],
			ValidFrom:  result["not-before"],
			ValidTill:  result["not-after"],
		}

		if serialNum, ok := result["serial-number"]; ok {
			cert.SerialNumber = serialNum
		}
		if fingerprint, ok := result["fingerprint"]; ok {
			cert.Fingerprint = fingerprint
		}
		if expiresAfter, ok := result["expires-after"]; ok {
			cert.ExpiresAfter = expiresAfter
		}
		if trusted, ok := result["trusted"]; ok {
			cert.Trusted = trusted == "true" || trusted == "yes"
		}
		if trustStore, ok := result["trust-store"]; ok {
			cert.TrustStore = trustStore
		}

		// Check for private key presence
		if flags, ok := result[".flags"]; ok {
			cert.HasPrivateKey = strings.Contains(flags, "K")
		}

		if cert.ValidTill != "" {
			validTill, err := time.Parse("2006-01-02 15:04:05", cert.ValidTill)
			if err == nil {
				cert.Expired = validTill.Before(time.Now())
			}
		}

		certs = append(certs, cert)
	}

	return certs, nil
}

// SetCertificateKeyUsage sets the key-usage for a certificate in RouterOS.
// It accepts a slice of key usage values. Valid values include: digital-signature,
// content-commitment, key-encipherment, data-encipherment, key-agreement,
// key-cert-sign, crl-sign, encipher-only, decipher-only, server-auth,
// client-auth, code-signing, email-protection, time-stamping, ocsp-signing.
func (c *Client) SetCertificateKeyUsage(name string, keyUsages []string) error {
	if name == "" {
		return fmt.Errorf("certificate name is required")
	}

	if len(keyUsages) == 0 {
		return fmt.Errorf("at least one key usage value is required")
	}

	results, err := c.GetAll("/certificate", "?=name="+name)
	if err != nil {
		return fmt.Errorf("failed to find certificate: %w", err)
	}

	if len(results) == 0 {
		return fmt.Errorf("certificate not found: %s", name)
	}

	certID := results[0][".id"]
	keyUsageStr := strings.Join(keyUsages, ",")

	_, err = c.Set("/certificate", "=.id="+certID, "=key-usage="+keyUsageStr)
	if err != nil {
		return fmt.Errorf("failed to set certificate key usage: %w", err)
	}

	return nil
}
