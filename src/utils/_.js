const default_ = Symbol('hotncold')

function __(obj, _ = default_) {
  if (this instanceof __) {
    _ = Symbol(`hotncold${typeof obj == 'string' ? `:${obj}` : ''}`)

    return obj => __(obj, _)
  }

  if (!obj[_]) {
    obj[_] = {}
  }

  return obj[_]
}

export default __;
