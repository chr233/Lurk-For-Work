import { BACKEND_ENDPOINT } from "./config.js";

class HttpClient {
  constructor(timeout = 3000) {
    this.timeout = timeout;
  }

  get(path, opt = {}) {
    return this.baseRequest(path, "GET", opt, "json");
  }

  getHtml(path, opt = {}) {
    return this.baseRequest(path, "GET", opt, "text");
  }

  post(path, data, opt = {}) {
    opt.body = JSON.stringify(data);
    return this.baseRequest(path, "POST", opt, "json");
  }

  put(path, data, opt = {}) {
    opt.body = JSON.stringify(data);
    return this.baseRequest(path, "PUT", opt, "json");
  }

  delete(path, data, opt = {}) {
    opt.body = JSON.stringify(data);
    return this.baseRequest(path, "DELETE", opt, "json");
  }

  baseRequest(path, method = "GET", opt = {}) {
    if (!path.startsWith("/")) {
      path = "/" + path;
    }

    const url = `${BACKEND_ENDPOINT}${path}`;

    Object.assign(opt, {
      method,
      // credentials: "include",
      cache: "no-cache",
      mode: "cors",
      headers: {},
    });

    const token = localStorage["token"];
    if (token) {
      opt.headers["Authorization"] = `Bearer ${token}`;
    }

    if (method !== "GET") {
      opt.headers["Content-Type"] = "application/json";
      opt.headers["Accept"] = "application/json";
    }

    return new Promise((resolve, reject) => {
      fetch(url, opt)
        .then((response) => response.json())
        .then((data) => {
          const errMsg = data.error;
          if (errMsg === "Invalid token") {
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
          }

          const success = !errMsg;
          resolve([success, success ? data : data.error]);
        })
        .catch((err) => {
          resolve([false, "Network error"]);
        });
    });
  }
}

export const $http = new HttpClient();
