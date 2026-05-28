package main

import "testing"

func TestGetUser(t *testing.T) {
	svc := &userServiceImpl{}
	client := NewClient(svc)
	name, err := client.GetUser(1)
	if err != nil || name != "Alice" { t.Fatal("get user 1 failed") }
}

func TestGetUnknownUser(t *testing.T) {
	svc := &userServiceImpl{}
	client := NewClient(svc)
	_, err := client.GetUser(99)
	if err != nil { t.Fatal("unknown user should not error") }
}

func TestServiceInterface(t *testing.T) {
	var _ UserService = (*userServiceImpl)(nil) // compile-time check
}

func TestMultipleUsers(t *testing.T) {
	svc := &userServiceImpl{}
	client := NewClient(svc)
	names := []string{"Alice", "Bob", "Charlie"}
	for i, expected := range names {
		name, _ := client.GetUser(int32(i + 1))
		if name != expected { t.Fatalf("user %d: got %s, want %s", i+1, name, expected) }
	}
}
