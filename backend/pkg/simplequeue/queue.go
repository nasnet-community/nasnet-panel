package simplequeue

import (
	"fmt"
	"sync"
)

// Queue is a thread-safe generic FIFO queue with fixed capacity.
type Queue[T any] struct {
	name     string
	capacity int
	data     []T
	mu       sync.RWMutex
}

// New creates a new FIFO queue with the given name and capacity.
func New[T any](name string, capacity int) *Queue[T] {
	if capacity <= 0 {
		capacity = 10
	}
	return &Queue[T]{
		name:     name,
		capacity: capacity,
		data:     make([]T, 0, capacity),
	}
}

// Push adds an item to the queue. If the queue is at capacity, the oldest item is removed.
func (q *Queue[T]) Push(item T) {
	q.mu.Lock()
	defer q.mu.Unlock()

	if len(q.data) >= q.capacity {
		q.data = q.data[1:]
	}
	q.data = append(q.data, item)
}

// Pop removes and returns the first item in the queue.
// Returns error if queue is empty.
func (q *Queue[T]) Pop() (T, error) {
	q.mu.Lock()
	defer q.mu.Unlock()

	var zero T
	if len(q.data) == 0 {
		return zero, fmt.Errorf("queue %s is empty", q.name)
	}

	item := q.data[0]
	q.data = q.data[1:]
	return item, nil
}

// Peek returns the first item without removing it.
// Returns error if queue is empty.
func (q *Queue[T]) Peek() (T, error) {
	q.mu.RLock()
	defer q.mu.RUnlock()

	var zero T
	if len(q.data) == 0 {
		return zero, fmt.Errorf("queue %s is empty", q.name)
	}

	return q.data[0], nil
}

// Size returns the current number of items in the queue.
func (q *Queue[T]) Size() int {
	q.mu.RLock()
	defer q.mu.RUnlock()
	return len(q.data)
}

// Capacity returns the maximum capacity of the queue.
func (q *Queue[T]) Capacity() int {
	return q.capacity
}

// Name returns the name of the queue.
func (q *Queue[T]) Name() string {
	return q.name
}

// IsFull returns true if the queue is at capacity.
func (q *Queue[T]) IsFull() bool {
	q.mu.RLock()
	defer q.mu.RUnlock()
	return len(q.data) >= q.capacity
}

// IsEmpty returns true if the queue has no items.
func (q *Queue[T]) IsEmpty() bool {
	q.mu.RLock()
	defer q.mu.RUnlock()
	return len(q.data) == 0
}

// GetAll returns a copy of all items in the queue.
func (q *Queue[T]) GetAll() []T {
	q.mu.RLock()
	defer q.mu.RUnlock()

	result := make([]T, len(q.data))
	copy(result, q.data)
	return result
}

// Clear removes all items from the queue.
func (q *Queue[T]) Clear() {
	q.mu.Lock()
	defer q.mu.Unlock()
	q.data = make([]T, 0, q.capacity)
}
