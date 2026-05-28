package kube

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"runtime"
	"sync"
	"sync/atomic"

	"github.com/creack/pty"
	"k8s.io/client-go/tools/clientcmd"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
)

type TerminalDataFunc func(data []byte)
type TerminalCloseFunc func(err error)

type terminalSession struct {
	id         string
	cmd        *exec.Cmd
	ptmx       *os.File
	cancel     context.CancelFunc
	kubeconfig string
	once       sync.Once
}

func (s *terminalSession) close() {
	s.once.Do(func() {
		s.cancel()
		if s.ptmx != nil {
			_ = s.ptmx.Close()
		}
		if s.cmd != nil && s.cmd.Process != nil {
			_ = s.cmd.Process.Kill()
		}
		if s.kubeconfig != "" {
			_ = os.Remove(s.kubeconfig)
		}
	})
}

type terminalSessionManager struct {
	mu       sync.Mutex
	sessions map[string]*terminalSession
	counter  uint64
}

func newTerminalSessionManager() *terminalSessionManager {
	return &terminalSessionManager{sessions: make(map[string]*terminalSession)}
}

// start spawns a host login shell with KUBECONFIG pointing at a minified
// single-context copy of the user's kubeconfig. The shell inherits the
// user's existing environment so PATH-resolved kubectl, helm, stern, etc.
// talk to the right cluster without any further interactive setup.
func (mgr *terminalSessionManager) start(
	parent context.Context,
	rules *clientcmd.ClientConfigLoadingRules,
	contextName string,
	cols, rows uint16,
	onData TerminalDataFunc,
	onClose TerminalCloseFunc,
) (string, error) {
	if runtime.GOOS == "windows" {
		return "", fmt.Errorf("terminal sessions are not supported on Windows yet")
	}
	if contextName == "" {
		return "", fmt.Errorf("context name is required")
	}

	kubeconfigPath, err := writeContextKubeconfig(rules, contextName)
	if err != nil {
		return "", err
	}

	ctx, cancel := context.WithCancel(parent)
	shell := userShell()
	cmd := exec.CommandContext(ctx, shell, loginShellArgs(shell)...)
	cmd.Env = append(os.Environ(),
		"KUBECONFIG="+kubeconfigPath,
		"KLUSTR_CONTEXT="+contextName,
		// Hint for users with PS1 logic that wants to surface the cluster.
		"KUBE_CONTEXT="+contextName,
	)
	if home, err := os.UserHomeDir(); err == nil {
		cmd.Dir = home
	}

	winsz := &pty.Winsize{Cols: cols, Rows: rows}
	if winsz.Cols == 0 {
		winsz.Cols = 80
	}
	if winsz.Rows == 0 {
		winsz.Rows = 24
	}

	ptmx, err := pty.StartWithSize(cmd, winsz)
	if err != nil {
		cancel()
		_ = os.Remove(kubeconfigPath)
		return "", err
	}

	id := fmt.Sprintf("term-%d", atomic.AddUint64(&mgr.counter, 1))
	sess := &terminalSession{
		id:         id,
		cmd:        cmd,
		ptmx:       ptmx,
		cancel:     cancel,
		kubeconfig: kubeconfigPath,
	}

	mgr.mu.Lock()
	mgr.sessions[id] = sess
	mgr.mu.Unlock()

	go func() {
		buf := make([]byte, 4096)
		for {
			n, err := ptmx.Read(buf)
			if n > 0 {
				onData(append([]byte(nil), buf[:n]...))
			}
			if err != nil {
				break
			}
		}
		waitErr := cmd.Wait()
		mgr.mu.Lock()
		delete(mgr.sessions, id)
		mgr.mu.Unlock()
		sess.close()
		if onClose != nil {
			if waitErr == nil || errors.Is(waitErr, io.EOF) || ctx.Err() == context.Canceled {
				onClose(nil)
			} else {
				onClose(waitErr)
			}
		}
	}()

	return id, nil
}

func (mgr *terminalSessionManager) sendInput(id, data string) {
	mgr.mu.Lock()
	sess := mgr.sessions[id]
	mgr.mu.Unlock()
	if sess == nil {
		return
	}
	_, _ = sess.ptmx.Write([]byte(data))
}

func (mgr *terminalSessionManager) resize(id string, cols, rows uint16) {
	mgr.mu.Lock()
	sess := mgr.sessions[id]
	mgr.mu.Unlock()
	if sess == nil {
		return
	}
	_ = pty.Setsize(sess.ptmx, &pty.Winsize{Cols: cols, Rows: rows})
}

func (mgr *terminalSessionManager) stop(id string) {
	mgr.mu.Lock()
	sess, ok := mgr.sessions[id]
	if ok {
		delete(mgr.sessions, id)
	}
	mgr.mu.Unlock()
	if ok {
		sess.close()
	}
}

func (mgr *terminalSessionManager) stopAll() {
	mgr.mu.Lock()
	sessions := make([]*terminalSession, 0, len(mgr.sessions))
	for _, s := range mgr.sessions {
		sessions = append(sessions, s)
	}
	mgr.sessions = make(map[string]*terminalSession)
	mgr.mu.Unlock()
	for _, s := range sessions {
		s.close()
	}
}

func userShell() string {
	if s := os.Getenv("SHELL"); s != "" {
		return s
	}
	if runtime.GOOS == "darwin" {
		return "/bin/zsh"
	}
	return "/bin/bash"
}

// loginShellArgs picks the right "behave like a login shell" flag so the
// user's normal rc files (.zshrc / .bashrc / .profile) are sourced and
// prompts, aliases and shell functions look like a regular Terminal tab.
func loginShellArgs(shell string) []string {
	switch {
	case endsWith(shell, "zsh"), endsWith(shell, "bash"):
		return []string{"-l"}
	default:
		return nil
	}
}

func endsWith(s, suffix string) bool {
	if len(s) < len(suffix) {
		return false
	}
	return s[len(s)-len(suffix):] == suffix
}

// writeContextKubeconfig writes a minified kubeconfig containing only
// the named context, its cluster, and its auth user to a 0600 temp file.
// The spawned shell loads it via KUBECONFIG=<path> so kubectl, helm,
// stern, etc. target the right cluster without the user running
// `kubectl config use-context` and without us touching their real
// ~/.kube/config (which may have dozens of contexts they don't want
// any single terminal tab to mutate).
func writeContextKubeconfig(rules *clientcmd.ClientConfigLoadingRules, contextName string) (string, error) {
	raw, err := rules.Load()
	if err != nil {
		return "", err
	}
	if _, ok := raw.Contexts[contextName]; !ok {
		return "", fmt.Errorf("context %q not found", contextName)
	}
	cfg := raw.DeepCopy()
	cfg.CurrentContext = contextName
	if err := clientcmdapi.MinifyConfig(cfg); err != nil {
		return "", err
	}

	f, err := os.CreateTemp("", "klustr-kubeconfig-*.yaml")
	if err != nil {
		return "", err
	}
	path := f.Name()
	_ = f.Close()
	if err := os.Chmod(path, 0o600); err != nil {
		_ = os.Remove(path)
		return "", err
	}
	if err := clientcmd.WriteToFile(*cfg, path); err != nil {
		_ = os.Remove(path)
		return "", err
	}
	return path, nil
}
