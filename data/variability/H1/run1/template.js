const RED = 'RED';
const BLACK = 'BLACK';

class Node {
  constructor(key) {
    this.key = key;
    this.color = RED;
    this.left = null;
    this.right = null;
    this.parent = null;
  }
}

class RedBlackTree {
  constructor() {
    this.NIL = new Node(null);
    this.NIL.color = BLACK;
    this.NIL.left = this.NIL;
    this.NIL.right = this.NIL;
    this.NIL.parent = this.NIL;
    this.root = this.NIL;
  }

  insert(key) {
    const newNode = new Node(key);
    newNode.left = this.NIL;
    newNode.right = this.NIL;

    let parent = this.NIL;
    let current = this.root;

    while (current !== this.NIL) {
      parent = current;
      if (newNode.key < current.key) {
        current = current.left;
      } else if (newNode.key > current.key) {
        current = current.right;
      } else {
        current.key = newNode.key;
        return;
      }
    }

    newNode.parent = parent;
    if (parent === this.NIL) {
      this.root = newNode;
    } else if (newNode.key < parent.key) {
      parent.left = newNode;
    } else {
      parent.right = newNode;
    }

    this._fixInsert(newNode);
  }

  _leftRotate(x) {
    const y = x.right;
    x.right = y.left;
    if (y.left !== this.NIL) {
      y.left.parent = x;
    }
    y.parent = x.parent;
    if (x.parent === this.NIL) {
      this.root = y;
    } else if (x === x.parent.left) {
      x.parent.left = y;
    } else {
      x.parent.right = y;
    }
    y.left = x;
    x.parent = y;
  }

  _rightRotate(y) {
    const x = y.left;
    y.left = x.right;
    if (x.right !== this.NIL) {
      x.right.parent = y;
    }
    x.parent = y.parent;
    if (y.parent === this.NIL) {
      this.root = x;
    } else if (y === y.parent.left) {
      y.parent.left = x;
    } else {
      y.parent.right = x;
    }
    x.right = y;
    y.parent = x;
  }

  _fixInsert(z) {
    while (z.parent.color === RED) {
      if (z.parent === z.parent.parent.left) {
        const uncle = z.parent.parent.right;
        if (uncle.color === RED) {
          z.parent.color = BLACK;
          uncle.color = BLACK;
          z.parent.parent.color = RED;
          z = z.parent.parent;
        } else {
          if (z === z.parent.right) {
            z = z.parent;
            this._leftRotate(z);
          }
          z.parent.color = BLACK;
          z.parent.parent.color = RED;
          this._rightRotate(z.parent.parent);
        }
      } else {
        const uncle = z.parent.parent.left;
        if (uncle.color === RED) {
          z.parent.color = BLACK;
          uncle.color = BLACK;
          z.parent.parent.color = RED;
          z = z.parent.parent;
        } else {
          if (z === z.parent.left) {
            z = z.parent;
            this._rightRotate(z);
          }
          z.parent.color = BLACK;
          z.parent.parent.color = RED;
          this._leftRotate(z.parent.parent);
        }
      }
    }
    this.root.color = BLACK;
  }

  search(key) {
    let curr = this.root;
    while (curr !== this.NIL) {
      if (key === curr.key) return true;
      curr = key < curr.key ? curr.left : curr.right;
    }
    return false;
  }

  inorder() {
    const result = [];
    this._inorderWalk(this.root, result);
    return result;
  }

  _inorderWalk(node, out) {
    if (node !== this.NIL) {
      this._inorderWalk(node.left, out);
      out.push(node.key);
      this._inorderWalk(node.right, out);
    }
  }

  height() {
    return this._calcHeight(this.root);
  }

  _calcHeight(node) {
    if (node === this.NIL) return 0;
    return 1 + Math.max(this._calcHeight(node.left), this._calcHeight(node.right));
  }

  validate() {
    if (this.root === this.NIL) return true;
    if (this.root.color !== BLACK) return false;
    return this._checkBlackHeight(this.root) !== -1;
  }

  _checkBlackHeight(node) {
    if (node === this.NIL) return 1;
    if (node.color === RED) {
      if (node.left.color === RED || node.right.color === RED) return -1;
    }
    const leftBH = this._checkBlackHeight(node.left);
    const rightBH = this._checkBlackHeight(node.right);
    if (leftBH === -1 || rightBH === -1 || leftBH !== rightBH) return -1;
    return leftBH + (node.color === BLACK ? 1 : 0);
  }
}

module.exports = { RedBlackTree, Node, RED, BLACK };
