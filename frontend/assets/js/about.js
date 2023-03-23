(() => {
  "use strict";
  
  let objs = {};

  window.SPA_INIT = (args) => {
    console.log("load event");
  };

  window.SPA_CHANGE = (args) => {
    console.log("hash change event");
  };
})();
