(() => {
  "use strict";

  let objs = {};
  let currentIndex = 0;

  // init
  window.SPA_INIT = (args) => {
    const jobList = document.getElementById("job-list");
    const btnLoadMore = document.getElementById("load-more");

    btnLoadMore.addEventListener("click", () => loadJobList(currentIndex));
    document
      .getElementById("publish-new-job")
      .addEventListener("click", (event) => {
        location.hash = "#edit-job";
      });

    objs = {
      jobList,
      btnLoadMore,
    };

    if (!args || args < 0) {
      args = 0;
    }
    loadJobList(args);
  };

  // hash change
  window.WPA_CHANGE = (args) => {};

  function loadJobList(start) {
    const { jobList, btnLoadMore } = objs;

    $api.getJobFeed(start).then(([succ, data]) => {
      if (!succ) {
        alert(data);
        return;
      }

      if (data && data.length > 0) {
        currentIndex += data.length;
        for (let x of data) {
          const li = $ele.genJobItem(x);
          jobList.appendChild(li);
        }
      } else {
        btnLoadMore.disabled = true;
        btnLoadMore.textContent = "Oppos, there is no more jobs";
      }
    });

    location.hash = `#feed=${currentIndex}`;
  }
})();
