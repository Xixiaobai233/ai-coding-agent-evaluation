function processOrder(order) {
  if (!order?.items?.length) return { error: 'Empty order' };
  if (order.status !== 'pending') return { error: 'Invalid status' };
  const total = order.items.reduce((s, i) => s + i.price * i.qty, 0);
  return { status: 'processed', total };
}