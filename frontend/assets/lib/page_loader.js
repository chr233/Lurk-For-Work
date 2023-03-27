"use strict";

class PageLoader {
  constructor(timeout = 3000) {
    this.lastPath = null;
    this.timeout = timeout;
  }

  getPage(name, id, args) {
    return this.baseRequest(name, id, args);
  }

  baseRequest(name, id, args) {
    const ele = document.getElementById(id);
    if (!ele) {
      console.error("Element not found: ", id);
      reject();
    }

    const url = `${location.origin}/views/${name}.html`;

    const opt = {
      method: "GET",
      cache: "no-cache",
      mode: "cors",
    };

    if (name == "login-tips") {
      name = "login";
    }

    return new Promise((resolve, reject) => {
      if (name !== this.lastPath) {
        this.lastPath = name;

        window.SPA_INIT = null;
        window.SPA_CHANGE = null;

        const t = setInterval(() => {
          if (
            window.myInfo ||
            name === "login" ||
            name === "signup" ||
            name === "login-tips"
          ) {
            clearInterval(t);
            
            fetch(url, opt)
              .then((response) => response.text())
              .then((data) => {
                if (args) {
                  console.log("load page at:", url, "args", args);
                } else {
                  console.log("load page at:", url);
                }

                const newEle = window.$ele.updateElementHtml(ele, data);

                // load js for views
                const scriptEle = document.createElement("script");
                scriptEle.type = "text/javascript";
                scriptEle.src = `/assets/js/${name}.js`;
                scriptEle.async = true;
                scriptEle.addEventListener("load", () => {
                  console.log("load js at:", scriptEle.src);
                  if (window.SPA_INIT) {
                    window.SPA_INIT(args);
                  }
                });
                scriptEle.addEventListener("error", () => {
                  console.error("load js error at:", scriptEle.src);
                });
                newEle.appendChild(scriptEle);

                resolve();
              })
              .catch((err) => {
                console.log("load page error:", err);
                window.$ele.updateElementHtml(ele, "<h1>load page error</h1>");
                resolve();
              });
          }
        }, 500);
      } else {
        console.log("path not changed, skip load page:", name);

        if (window.SPA_CHANGE) {
          window.SPA_CHANGE(args);
        }

        resolve();
      }
    });
  }
}

export const $page = new PageLoader();
