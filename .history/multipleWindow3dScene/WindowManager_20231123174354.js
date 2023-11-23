class WindowManager {
  #windows;
  #count;
  #id;
  #winData;
  #winShapeChangeCallback;
  #winChangeCallback;

  constructor() {
    addEventListener("storage", (event) => {
      if (event.key === "windows") {
        try {
          const newWindows = JSON.parse(event.newValue);
          if (this.#didWindowsChange(this.#windows, newWindows)) {
            this.#windows = newWindows;
            this.#winChangeCallback?.();
          }
        } catch (e) {
          console.error("Error parsing windows data: ", e);
        }
      }
    });

    window.addEventListener("beforeunload", () => {
      const index = this.getWindowIndexFromId(this.#id);
      if (index !== -1) {
        this.#windows.splice(index, 1);
        this.updateWindowsLocalStorage();
      }
    });
  }

  #didWindowsChange(pWins, nWins) {
    return (
      pWins.length !== nWins.length ||
      pWins.some((pw, i) => pw.id !== nWins[i].id)
    );
  }

  init(metaData) {
    try {
      this.#windows = JSON.parse(localStorage.getItem("windows")) || [];
    } catch (e) {
      console.error("Error parsing windows data: ", e);
      this.#windows = [];
    }

    this.#count = parseInt(localStorage.getItem("count"), 10) || 0;
    this.#id = ++this.#count;
    const shape = this.getWinShape();
    this.#winData = { id: this.#id, shape, metaData };
    this.#windows.push(this.#winData);

    localStorage.setItem("count", this.#count.toString());
    this.updateWindowsLocalStorage();
  }

  getWinShape() {
    return {
      x: window.screenLeft,
      y: window.screenTop,
      w: window.innerWidth,
      h: window.innerHeight,
    };
  }

  getWindowIndexFromId(id) {
    return this.#windows.findIndex((win) => win.id === id);
  }

  updateWindowsLocalStorage() {
    localStorage.setItem("windows", JSON.stringify(this.#windows));
  }

  update() {
    const winShape = this.getWinShape();

    if (JSON.stringify(winShape) !== JSON.stringify(this.#winData.shape)) {
      this.#winData.shape = winShape;
      const index = this.getWindowIndexFromId(this.#id);
      if (index !== -1) {
        this.#windows[index].shape = winShape;
        this.#winShapeChangeCallback?.();
        this.updateWindowsLocalStorage();
      }
    }
  }

  setWinShapeChangeCallback(callback) {
    this.#winShapeChangeCallback = callback;
  }

  setWinChangeCallback(callback) {
    this.#winChangeCallback = callback;
  }

  getWindows() {
    return this.#windows;
  }

  getThisWindowData() {
    return this.#winData;
  }

  getThisWindowID() {
    return this.#id;
  }
}

export default WindowManager;
