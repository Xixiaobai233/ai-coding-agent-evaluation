package main
import "sync"
import "testing"
func TestConcurrent(t *testing.T) {
	mq := NewMessageQueue()
	var wg sync.WaitGroup
	for i:=0; i<10; i++ {
		wg.Add(1)
		go func() { defer wg.Done(); mq.Publish("m") }()
	}
	wg.Wait()
	if mq.Len() != 10 { t.Fatalf("got %d", mq.Len()) }
}
