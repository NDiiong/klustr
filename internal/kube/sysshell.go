package kube

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

// SystemTerminal is a terminal app discovered on the host. The frontend
// renders these as a "Preferred terminal" picker so the user gets to
// pick (e.g.) Ghostty over the macOS default Terminal.app.
type SystemTerminal struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type darwinTerminalApp struct {
	id      string
	name    string
	appName string
	relPath string
}

var darwinKnownTerminals = []darwinTerminalApp{
	{"terminal", "Terminal", "Terminal", "Terminal.app"},
	{"iterm", "iTerm2", "iTerm", "iTerm.app"},
	{"ghostty", "Ghostty", "Ghostty", "Ghostty.app"},
	{"warp", "Warp", "Warp", "Warp.app"},
	{"alacritty", "Alacritty", "Alacritty", "Alacritty.app"},
	{"kitty", "kitty", "kitty", "kitty.app"},
	{"wezterm", "WezTerm", "WezTerm", "WezTerm.app"},
	{"hyper", "Hyper", "Hyper", "Hyper.app"},
}

// ListSystemTerminals returns the terminal emulators installed on the
// host. Empty on Windows. On macOS this scans /Applications +
// ~/Applications; on Linux it probes the PATH for the same priority
// list that launchLinuxTerminal would itself try.
func (m *ClientManager) ListSystemTerminals() []SystemTerminal {
	switch runtime.GOOS {
	case "darwin":
		return listDarwinTerminals()
	case "linux":
		return listLinuxTerminals()
	}
	return []SystemTerminal{}
}

// OpenInSystemTerminal launches the user's external terminal emulator
// with KUBECONFIG pre-set to a minified single-context copy of their
// kubeconfig, then drops them into their normal login shell. The temp
// kubeconfig and the launcher script self-delete after the shell exits
// via an EXIT trap.
//
// appID picks a specific terminal app — values are the ids returned by
// ListSystemTerminals. An empty appID means: defer to the OS default
// handler for .command files on macOS, or walk the built-in priority
// list on Linux.
func (m *ClientManager) OpenInSystemTerminal(contextName, appID string) error {
	if contextName == "" {
		return fmt.Errorf("context name is required")
	}
	if runtime.GOOS == "windows" {
		return fmt.Errorf("opening a system terminal is not supported on Windows yet")
	}

	kubeconfigPath, err := writeContextKubeconfig(m.rules, contextName)
	if err != nil {
		return err
	}
	scriptPath, err := writeLauncherScript(kubeconfigPath, contextName)
	if err != nil {
		_ = os.Remove(kubeconfigPath)
		return err
	}
	if err := launchExternalTerminal(scriptPath, appID); err != nil {
		_ = os.Remove(kubeconfigPath)
		_ = os.Remove(scriptPath)
		return err
	}
	return nil
}

func writeLauncherScript(kubeconfigPath, contextName string) (string, error) {
	suffix := ".sh"
	if runtime.GOOS == "darwin" {
		// .command is the macOS double-clickable shell-script extension;
		// `open` routes it to the user's preferred terminal app.
		suffix = ".command"
	}

	f, err := os.CreateTemp("", "klustr-shell-*"+suffix)
	if err != nil {
		return "", err
	}
	path := f.Name()

	// %q produces a shell-safe double-quoted form for paths that may
	// contain spaces or other special characters. The EXIT trap cleans
	// up both files even when the user closes the terminal window —
	// only an outright SIGKILL leaks them.
	body := fmt.Sprintf(`#!/bin/sh
KC=%q
SCRIPT=%q
trap 'rm -f "$KC" "$SCRIPT"' EXIT
export KUBECONFIG="$KC"
export KLUSTR_CONTEXT=%q
export KUBE_CONTEXT=%q
cd "$HOME" 2>/dev/null || true
"${SHELL:-/bin/sh}" -l
`, kubeconfigPath, path, contextName, contextName)

	if _, err := f.WriteString(body); err != nil {
		_ = f.Close()
		_ = os.Remove(path)
		return "", err
	}
	if err := f.Close(); err != nil {
		_ = os.Remove(path)
		return "", err
	}
	if err := os.Chmod(path, 0o700); err != nil {
		_ = os.Remove(path)
		return "", err
	}
	return path, nil
}

func launchExternalTerminal(scriptPath, appID string) error {
	switch runtime.GOOS {
	case "darwin":
		return launchDarwinTerminal(scriptPath, appID)
	case "linux":
		return launchLinuxTerminal(scriptPath, appID)
	default:
		return fmt.Errorf("opening a system terminal is not supported on %s", runtime.GOOS)
	}
}

func launchDarwinTerminal(scriptPath, appID string) error {
	if appID == "" {
		// macOS picks whichever app is registered as the .command
		// handler — usually Terminal.app, or whatever the user set in
		// Finder > Get Info > Open With.
		return exec.Command("open", scriptPath).Start()
	}
	for _, t := range darwinKnownTerminals {
		if t.id != appID {
			continue
		}
		return exec.Command("open", "-a", t.appName, scriptPath).Start()
	}
	return fmt.Errorf("unknown terminal app %q", appID)
}

func listDarwinTerminals() []SystemTerminal {
	dirs := []string{
		"/Applications",
		"/Applications/Utilities",
		// Apple moved Terminal.app under /System on Catalina+. We still
		// scan /Applications/Utilities for older systems and bundles
		// users have placed there manually.
		"/System/Applications/Utilities",
	}
	if home, err := os.UserHomeDir(); err == nil {
		dirs = append(dirs, filepath.Join(home, "Applications"))
	}
	out := make([]SystemTerminal, 0, len(darwinKnownTerminals))
	seen := map[string]bool{}
	for _, t := range darwinKnownTerminals {
		if seen[t.id] {
			continue
		}
		for _, d := range dirs {
			if _, err := os.Stat(filepath.Join(d, t.relPath)); err == nil {
				out = append(out, SystemTerminal{ID: t.id, Name: t.name})
				seen[t.id] = true
				break
			}
		}
	}
	return out
}

type terminalLauncher struct {
	id    string
	label string
	bin   string
	args  func(script string) []string
}

var linuxKnownTerminals = []terminalLauncher{
	{"gnome-terminal", "GNOME Terminal", "gnome-terminal", func(s string) []string { return []string{"--", s} }},
	{"konsole", "Konsole", "konsole", func(s string) []string { return []string{"-e", s} }},
	{"xfce4-terminal", "Xfce Terminal", "xfce4-terminal", func(s string) []string { return []string{"-e", s} }},
	{"tilix", "Tilix", "tilix", func(s string) []string { return []string{"-e", s} }},
	{"ghostty", "Ghostty", "ghostty", func(s string) []string { return []string{"-e", s} }},
	{"kitty", "kitty", "kitty", func(s string) []string { return []string{s} }},
	{"alacritty", "Alacritty", "alacritty", func(s string) []string { return []string{"-e", s} }},
	{"wezterm", "WezTerm", "wezterm", func(s string) []string { return []string{"start", "--", s} }},
	{"foot", "foot", "foot", func(s string) []string { return []string{s} }},
	{"xterm", "xterm", "xterm", func(s string) []string { return []string{"-e", s} }},
}

func listLinuxTerminals() []SystemTerminal {
	out := make([]SystemTerminal, 0, len(linuxKnownTerminals))
	for _, c := range linuxKnownTerminals {
		if _, err := exec.LookPath(c.bin); err == nil {
			out = append(out, SystemTerminal{ID: c.id, Name: c.label})
		}
	}
	return out
}

func launchLinuxTerminal(scriptPath, appID string) error {
	if appID != "" {
		for _, c := range linuxKnownTerminals {
			if c.id != appID {
				continue
			}
			bin, err := exec.LookPath(c.bin)
			if err != nil {
				return fmt.Errorf("%s is not on PATH", c.bin)
			}
			return exec.Command(bin, c.args(scriptPath)...).Start()
		}
		return fmt.Errorf("unknown terminal app %q", appID)
	}

	// Empty appID: try x-terminal-emulator (Debian alternatives system)
	// first, otherwise walk the known list in priority order.
	if bin, err := exec.LookPath("x-terminal-emulator"); err == nil {
		return exec.Command(bin, "-e", scriptPath).Start()
	}
	if pref := os.Getenv("KLUSTR_TERMINAL"); pref != "" {
		if bin, err := exec.LookPath(pref); err == nil {
			return exec.Command(bin, scriptPath).Start()
		}
	}
	for _, c := range linuxKnownTerminals {
		bin, err := exec.LookPath(c.bin)
		if err != nil {
			continue
		}
		return exec.Command(bin, c.args(scriptPath)...).Start()
	}
	return fmt.Errorf("no supported terminal emulator found on PATH (set $KLUSTR_TERMINAL or install gnome-terminal/konsole/kitty/alacritty/wezterm)")
}
