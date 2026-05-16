package kube

import (
	"context"
	"fmt"
	"io"
	"sync"
	"sync/atomic"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/remotecommand"
)

type ExecDataFunc func(data []byte)
type ExecCloseFunc func(err error)

type execSession struct {
	id     string
	cancel context.CancelFunc
	stdin  *io.PipeWriter
	resize chan remotecommand.TerminalSize
	once   sync.Once
}

func (s *execSession) close() {
	s.once.Do(func() {
		s.cancel()
		s.stdin.Close()
		close(s.resize)
	})
}

type execSessionManager struct {
	mu       sync.Mutex
	sessions map[string]*execSession
	counter  uint64
}

func newExecSessionManager() *execSessionManager {
	return &execSessionManager{sessions: make(map[string]*execSession)}
}

func (mgr *execSessionManager) start(
	parent context.Context,
	restCfg *rest.Config,
	cs *kubernetes.Clientset,
	namespace, podName, container string,
	command []string,
	onData ExecDataFunc,
	onClose ExecCloseFunc,
) (string, error) {
	if len(command) == 0 {
		command = []string{"/bin/sh"}
	}

	req := cs.CoreV1().RESTClient().Post().
		Resource("pods").
		Name(podName).
		Namespace(namespace).
		SubResource("exec").
		VersionedParams(&corev1.PodExecOptions{
			Container: container,
			Command:   command,
			Stdin:     true,
			Stdout:    true,
			Stderr:    true,
			TTY:       true,
		}, scheme.ParameterCodec)

	executor, err := remotecommand.NewSPDYExecutor(restCfg, "POST", req.URL())
	if err != nil {
		return "", err
	}

	ctx, cancel := context.WithCancel(parent)
	pr, pw := io.Pipe()
	resizeCh := make(chan remotecommand.TerminalSize, 4)

	id := fmt.Sprintf("exec-%d", atomic.AddUint64(&mgr.counter, 1))
	sess := &execSession{id: id, cancel: cancel, stdin: pw, resize: resizeCh}

	mgr.mu.Lock()
	mgr.sessions[id] = sess
	mgr.mu.Unlock()

	out := &execWriter{onData: onData}
	queue := &chanSizeQueue{ch: resizeCh}

	go func() {
		defer func() {
			pw.Close()
			mgr.mu.Lock()
			delete(mgr.sessions, id)
			mgr.mu.Unlock()
		}()
		err := executor.StreamWithContext(ctx, remotecommand.StreamOptions{
			Stdin:             pr,
			Stdout:            out,
			Stderr:            out,
			Tty:               true,
			TerminalSizeQueue: queue,
		})
		if onClose != nil {
			onClose(err)
		}
	}()

	return id, nil
}

func (mgr *execSessionManager) sendInput(id, data string) {
	mgr.mu.Lock()
	sess := mgr.sessions[id]
	mgr.mu.Unlock()
	if sess == nil {
		return
	}
	_, _ = sess.stdin.Write([]byte(data))
}

func (mgr *execSessionManager) resize(id string, cols, rows uint16) {
	mgr.mu.Lock()
	sess := mgr.sessions[id]
	mgr.mu.Unlock()
	if sess == nil {
		return
	}
	select {
	case sess.resize <- remotecommand.TerminalSize{Width: cols, Height: rows}:
	default:
	}
}

func (mgr *execSessionManager) stop(id string) {
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

type execWriter struct {
	onData ExecDataFunc
}

func (w *execWriter) Write(p []byte) (int, error) {
	w.onData(append([]byte(nil), p...))
	return len(p), nil
}

type chanSizeQueue struct {
	ch chan remotecommand.TerminalSize
}

func (q *chanSizeQueue) Next() *remotecommand.TerminalSize {
	s, ok := <-q.ch
	if !ok {
		return nil
	}
	return &s
}
