package install

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
)

const releaseLookupTimeout = 20 * time.Second

var releaseTagRe = regexp.MustCompile(`^v\d+\.\d+\.\d+([-+][0-9A-Za-z.-]+)?$`)

// resolveRelease maps Options.Version to the GitHub release to download from
// and the channel used in its asset names. An empty version means the latest
// tagged release, "snapshot" the rolling development snapshot, and anything
// else is taken as a release tag.
func (e *Engine) resolveRelease() (release, channel string, err error) {
	switch v := strings.TrimSpace(e.opts.Version); v {
	case snapshotRelease:
		return snapshotRelease, snapshotChannel, nil
	case "":
		e.log("looking up the latest release")
		tag, err := latestReleaseTag(e.ctx)
		if err != nil {
			return "", "", fmt.Errorf("could not find the latest %s/%s release on GitHub: %w. Check this computer's internet connection, or pick a release tag or the development snapshot under Advanced options", ghOwner, ghRepo, err)
		}
		e.log("latest release is %s", tag)
		return tag, strings.TrimPrefix(tag, "v"), nil
	default:
		return v, strings.TrimPrefix(v, "v"), nil
	}
}

// latestReleaseTag returns the tag of the latest published, non-prerelease
// release. It asks the GitHub API first and falls back to the
// github.com/.../releases/latest redirect, which is not subject to the
// unauthenticated API rate limit.
func latestReleaseTag(ctx context.Context) (string, error) {
	tag, apiErr := latestReleaseFromAPI(ctx)
	if apiErr == nil {
		return tag, nil
	}
	tag, pageErr := latestReleaseFromRedirect(ctx)
	if pageErr == nil {
		return tag, nil
	}
	return "", fmt.Errorf("%w; %w", apiErr, pageErr)
}

func latestReleaseFromAPI(ctx context.Context) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, releaseLookupTimeout)
	defer cancel()
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", ghOwner, ghRepo)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, http.NoBody)
	if err != nil {
		return "", err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("GitHub API: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("GitHub API: %s", resp.Status)
	}
	var body struct {
		TagName string `json:"tag_name"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&body); err != nil {
		return "", fmt.Errorf("GitHub API: %w", err)
	}
	return validReleaseTag(body.TagName)
}

func latestReleaseFromRedirect(ctx context.Context) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, releaseLookupTimeout)
	defer cancel()
	url := fmt.Sprintf("https://github.com/%s/%s/releases/latest", ghOwner, ghRepo)
	req, err := http.NewRequestWithContext(ctx, http.MethodHead, url, http.NoBody)
	if err != nil {
		return "", err
	}
	client := &http.Client{
		CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse },
	}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("releases page: %w", err)
	}
	_ = resp.Body.Close()
	loc := resp.Header.Get("Location")
	_, tag, ok := strings.Cut(loc, "/releases/tag/")
	if !ok {
		return "", fmt.Errorf("releases page: no release found (%s)", resp.Status)
	}
	return validReleaseTag(tag)
}

func validReleaseTag(tag string) (string, error) {
	if !releaseTagRe.MatchString(tag) {
		return "", fmt.Errorf("unexpected release tag %q", tag)
	}
	return tag, nil
}
