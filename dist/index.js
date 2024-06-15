let newQueue = (concurrency) => {
  let active = 0;
  let size = 0;
  let head;
  let tail;
  let resolveDonePromise;
  let donePromise;
  let Pomise = Promise;
  let afterRun = () => {
    active--;
    if (--size) {
      run();
    } else {
      donePromise = resolveDonePromise?.();
    }
  };
  let run = () => {
    if (!head || active >= concurrency) {
      return;
    }
    active++;
    let curHead = head;
    head = head.a;
    curHead.p().then(curHead.b, curHead.c).then(afterRun);
  };
  return {
    add: (p) => new Pomise((res, rej) => {
      let node = { p, b: res, c: rej };
      if (head) {
        tail = tail.a = node;
      } else {
        tail = head = node;
      }
      size++;
      run();
    }),
    done: () => {
      if (size < 1) {
        return Pomise.resolve();
      }
      if (donePromise) {
        return donePromise;
      }
      return donePromise = new Pomise((resolve) => resolveDonePromise = resolve);
    },
    clear() {
      head = tail = null;
      size = active;
    },
    active: () => active,
    size: () => size
  };
};
export {
  newQueue
};
