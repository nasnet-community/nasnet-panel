package main

import (
	"bufio"
	"fmt"
	"os"
	"regexp"
	"strings"
)

const marker = "<!-- lab-report -->"

var (
	stages   = []string{"TestStage1", "TestStage2", "TestStage3"}
	titles   = map[string]string{"TestStage1": "Install", "TestStage2": "Wizard", "TestStage3": "Resilience"}
	runLine  = regexp.MustCompile(`^=== RUN\s+(TestStage\d)/(\S+/\S+)$`)
	doneLine = regexp.MustCompile(`^\s*--- (PASS|FAIL|SKIP): (TestStage\d)/(\S+/\S+) `)
)

type counts struct {
	passed, failed, skipped, knownBugs int
}

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "usage: labreport <go test output>...")
		os.Exit(2)
	}

	totals := map[string]*counts{}
	for _, s := range stages {
		totals[s] = &counts{}
	}
	for _, path := range os.Args[1:] {
		if err := parse(path, totals); err != nil {
			fmt.Fprintln(os.Stderr, "labreport:", err)
			os.Exit(1)
		}
	}

	var sum counts
	var rows []string
	for _, s := range stages {
		c := totals[s]
		sum.passed += c.passed
		sum.failed += c.failed
		sum.skipped += c.skipped
		sum.knownBugs += c.knownBugs
		rows = append(rows, fmt.Sprintf("| %s | %d | %d | %d | %d |", titles[s], c.passed, c.failed, c.skipped, c.knownBugs))
	}

	fmt.Println(marker)
	fmt.Println("### Lab results")
	fmt.Println()
	fmt.Printf("✅ **%d** passed &nbsp; ❌ **%d** failed &nbsp; ⏭️ **%d** skipped\n", sum.passed, sum.failed, sum.skipped)
	fmt.Println()
	fmt.Println("| Stage | Passed | Failed | Skipped | Known bugs |")
	fmt.Println("| --- | --- | --- | --- | --- |")
	fmt.Println(strings.Join(rows, "\n"))
	fmt.Printf("| **Total** | **%d** | **%d** | **%d** | **%d** |\n", sum.passed, sum.failed, sum.skipped, sum.knownBugs)
}

func parse(path string, totals map[string]*counts) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer func() { _ = f.Close() }()

	started := map[string]string{}
	finished := map[string]bool{}
	bugs := map[string]bool{}
	current := ""

	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 1024*1024), 16*1024*1024)
	for scanner.Scan() {
		line := scanner.Text()
		if m := runLine.FindStringSubmatch(line); m != nil {
			current = m[1] + "/" + m[2]
			started[current] = m[1]
			continue
		}
		if m := doneLine.FindStringSubmatch(line); m != nil {
			key := m[2] + "/" + m[3]
			if finished[key] || totals[m[2]] == nil {
				continue
			}
			finished[key] = true
			switch m[1] {
			case "PASS":
				totals[m[2]].passed++
			case "FAIL":
				totals[m[2]].failed++
			case "SKIP":
				totals[m[2]].skipped++
			}
			continue
		}
		if current != "" && strings.Contains(line, "KNOWN BUG ") && !bugs[current] {
			bugs[current] = true
			if c := totals[started[current]]; c != nil {
				c.knownBugs++
			}
		}
	}
	if err := scanner.Err(); err != nil {
		return err
	}

	for key, stage := range started {
		if !finished[key] && totals[stage] != nil {
			totals[stage].failed++
		}
	}
	return nil
}
