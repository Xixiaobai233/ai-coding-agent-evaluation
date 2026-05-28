package main

// gRPC-style service without proto compilation requirement
type UserService interface {
	GetUser(id int32) (string, error)
}

type userServiceImpl struct{}

func (s *userServiceImpl) GetUser(id int32) (string, error) {
	users := map[int32]string{1: "Alice", 2: "Bob", 3: "Charlie"}
	return users[id], nil
}

type UserServiceClient struct {
	service UserService
}

func NewClient(svc UserService) *UserServiceClient {
	return &UserServiceClient{service: svc}
}

func (c *UserServiceClient) GetUser(id int32) (string, error) {
	return c.service.GetUser(id)
}
