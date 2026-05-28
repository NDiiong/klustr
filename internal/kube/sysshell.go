package kube

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
)

// OpenInSystemTerminal launches the user's external terminal emulator
// with KUBECONFIG pre-set to a minified single-context copy of their
// kubeconfig, then drops them into their normal login shell. The temp
// kubeconfig and the launcher script self-delete after the shell exits
// via an EXIT trap.
//
// macOS opens the .command file via `open`, which respects whatever app
// the user has set as the default handler — Terminal.app out of the box,
// or iTerm2 / Ghostty / Warp if they've reassigned the file type.
// Linux walks a priority list of common emulators (gnome-terminal,
// konsole, kitty, alacritty, …) and uses the first one on PATH; users
// can override with $KLUSTR_TERMINAL.
func (m *ClientManager) OpenInSystemTerminal(contextName string) error {
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
	if err := launchExternalTerminal(scriptPath); err != nil {
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

func launchExternalTerminal(scriptPath string) error {
	switch runtime.GOOS {
	case "darwin":
		return exec.Command("open", scriptPath).Start()
	case "linux":
		return launchLinuxTerminal(scriptPath)
	default:
		return fmt.Errorf("opening a system terminal is not supported on %s", runtime.GOOS)
	}
}

func launchLinuxTerminal(scriptPath string) error {
	// Try x-terminal-emulator (Debian alternatives system) first,
	// otherwise walk a small priority list of common emulators.
	candidates := []struct {
		bin  string
		args []string
	}{
		{"x-terminal-emulator", []string{"-e", scriptPath}},
		{"gnome-terminal", []string{"--", scriptPath}},
		{"konsole", []string{"-e", scriptPath}},
		{"xfce4-terminal", []string{"-e", scriptPath}},
		{"kitty", []string{scriptPath}},
		{"alacritty", []string{"-e", scriptPath}},
		{"wezterm", []string{"start", "--", scriptPath}},
		{"foot", []string{scriptPath}},
		{"xterm", []string{"-e", scriptPath}},
	}
	if pref := os.Getenv("KLUSTR_TERMINAL"); pref != "" {
		candidates = append([]struct {
			bin  string
			args []string
		}{{pref, []string{scriptPath}}}, candidates...)
	}
	for _, c := range candidates {
		bin, err := exec.LookPath(c.bin)
		if err != nil {
			continue
		}
		return exec.Command(bin, c.args...).Start()
	}
	return fmt.Errorf("no supported terminal emulator found on PATH (set $KLUSTR_TERMINAL or install gnome-terminal/konsole/kitty/alacritty/wezterm)")
}
